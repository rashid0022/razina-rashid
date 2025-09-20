// ApplyLoan.jsx
import { useState, useEffect } from "react";
import api from "./api";

export default function ApplyLoan({ state, setState, showNotification, setPage }) {
  const [step, setStep] = useState(1);
  const [preview, setPreview] = useState(null);
  const [sponsorPreview, setSponsorPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [csrfToken, setCsrfToken] = useState("");

 
  useEffect(() => {
    api.get("csrf/")
      .then(res => setCsrfToken(res.data.csrfToken))
      .catch(err => console.error(err));
  }, []);

  const fileToBase64 = (file, callback) => {
    const reader = new FileReader();
    reader.onloadend = () => callback(reader.result);
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    fileToBase64(file, (base64) => {
      if (e.target.name === "profile_photo") {
        setPreview(base64);
        setState(prev => ({ ...prev, tempApplicant: { ...prev.tempApplicant, profile_photo: base64 } }));
      } else if (e.target.name === "sponsor_photo") {
        setSponsorPreview(base64);
        setState(prev => ({ ...prev, tempApplicant: { ...prev.tempApplicant, sponsor_photo: base64 } }));
      }
    });
  };

  const handleApplicantSave = (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const data = Object.fromEntries(form.entries());

    if (!preview) return showNotification("Upload your photo", "error");
    if (!/^\d{20}$/.test(data.national_id)) return showNotification("Invalid National ID", "error");
    if (!/^\+255\d{9}$/.test(data.phone)) return showNotification("Invalid phone number", "error");
    if (data.password !== data.confirm_password) return showNotification("Passwords do not match", "error");

    setState(prev => ({ ...prev, tempApplicant: { ...data, profile_photo: preview } }));
    setStep(2);
  };

  const handleSponsorSubmit = async (e) => {
    e.preventDefault();
    if (!csrfToken) return showNotification("CSRF token missing", "error");

    const form = new FormData(e.target);
    const data = Object.fromEntries(form.entries());

    if (!sponsorPreview) return showNotification("Upload sponsor photo", "error");
    if (!/^\d{20}$/.test(data.sponsor_national_id)) return showNotification("Invalid sponsor ID", "error");

    setIsSubmitting(true);

    try {
     
      const [first_name, ...rest] = state.tempApplicant.name.split(" ");
      const last_name = rest.join(" ");

      
      const payload = {
        username: state.tempApplicant.username,
        password: state.tempApplicant.password,
        email: state.tempApplicant.email,
        first_name,
        last_name,
        phone: state.tempApplicant.phone,
        address: state.tempApplicant.address,
        national_id: state.tempApplicant.national_id,
        profile_photo: preview,
        loan_type: state.tempApplicant.loan_type,
        requested_amount: parseFloat(state.tempApplicant.requested_amount),
        assets_value: parseFloat(state.tempApplicant.assets_value),
        monthly_income: parseFloat(state.tempApplicant.monthly_income),
        sponsor_name: data.sponsor_name,
        sponsor_address: data.sponsor_address,
        sponsor_national_id: data.sponsor_national_id,
        sponsor_phone: data.sponsor_phone,
        sponsor_email: data.sponsor_email,
        sponsor_photo: sponsorPreview,
      };

      const response = await api.post("register-apply/", payload, {
        headers: { "X-CSRFToken": csrfToken }
      });

      if (response.status === 201) {
        const newUser = response.data.user;
        const newLoan = response.data.loan_application;

        showNotification("Application submitted successfully!", "success");

        setState(prev => ({
          ...prev,
          currentUser: newUser?.username || prev.currentUser,
          applications: [...(prev.applications || []), newLoan]
        }));

        setStep(1);
        setPreview(null);
        setSponsorPreview(null);
        setPage("dashboard");
      }
    } catch (err) {
      console.error("Submission error:", err.response?.data || err);
      showNotification("Error submitting application. Check your details and connection.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="loan-form">
      <h2>Apply for a Loan</h2>

      {step === 1 && (
        <form onSubmit={handleApplicantSave}>
          <input name="username" placeholder="Username" required />
          <input name="name" placeholder="Full Name" required />
          <input name="address" placeholder="Address" required />
          <input name="national_id" placeholder="National ID" maxLength="20" required />
          <input name="phone" placeholder="Phone (+255XXXXXXXXX)" maxLength="13" required />
          <input name="email" type="email" placeholder="Email" />
          <select name="loan_type" required>
            <option value="">Select Loan Type</option>
            <option value="home">Home</option>
            <option value="car">Car</option>
            <option value="education">Education</option>
            <option value="business">Business</option>
          </select>
          <input name="requested_amount" type="number" min="1" placeholder="Requested Amount" required />
          <input name="assets_value" type="number" min="1" placeholder="Assets Value" required />
          <input name="monthly_income" type="number" min="1" placeholder="Monthly Income" required />
          <input name="password" type="password" minLength="6" placeholder="Password" required />
          <input name="confirm_password" type="password" minLength="6" placeholder="Confirm Password" required />
          <label>Upload Profile Photo:</label>
          <input type="file" name="profile_photo" accept="image/*" onChange={handleFileChange} required />
          {preview && <img src={preview} alt="Preview" style={{ width: "100px" }} />}
          <button type="submit">Next: Sponsor Info</button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleSponsorSubmit}>
          <input name="sponsor_name" placeholder="Sponsor Name" required />
          <input name="sponsor_address" placeholder="Sponsor Address" required />
          <input name="sponsor_national_id" placeholder="Sponsor National ID" maxLength="20" required />
          <input name="sponsor_phone" placeholder="Sponsor Phone (+255XXXXXXXXX)" maxLength="13" required />
          <input name="sponsor_email" type="email" placeholder="Sponsor Email" required />
          <label>Upload Sponsor Photo:</label>
          <input type="file" name="sponsor_photo" accept="image/*" onChange={handleFileChange} required />
          {sponsorPreview && <img src={sponsorPreview} alt="Sponsor Preview" style={{ width: "100px" }} />}
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Loan Application"}
          </button>
        </form>
      )}
    </div>
  );
}
