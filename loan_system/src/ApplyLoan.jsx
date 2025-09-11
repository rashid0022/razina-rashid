import { useState } from "react";
import api from "./api";

export default function ApplyLoan({ state, setState, showNotification }) {
  const [preview, setPreview] = useState(null);
  const [sponsorPreview, setSponsorPreview] = useState(null);
  const [step, setStep] = useState(1);

  // Convert uploaded file to Base64
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
        setState(prev => ({ 
          ...prev, 
          tempApplicant: { ...prev.tempApplicant, profile_photo: base64 } 
        }));
      } else if (e.target.name === "sponsor_photo") {
        setSponsorPreview(base64);
        setState(prev => ({ 
          ...prev, 
          tempApplicant: { ...prev.tempApplicant, sponsor_photo: base64 } 
        }));
      }
    });
  };

  const handleApplicantSave = (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const data = Object.fromEntries(form.entries());

    // Basic validation
    if (!/^\d{20}$/.test(data.national_id)) return showNotification("Invalid National ID", "error");
    if (!/^\+255\d{9}$/.test(data.phone)) return showNotification("Invalid phone", "error");
    if (data.password !== data.confirm_password) return showNotification("Passwords do not match", "error");
    if (!preview) return showNotification("Upload your photo", "error");

    setState(prev => ({
      ...prev,
      tempApplicant: { ...data, profile_photo: preview }
    }));
    setStep(2);
  };

  const handleSponsorSubmit = async (e) => {
    e.preventDefault();

    if (!state.currentUser) {
      return showNotification("You must login first", "error");
    }

    const form = new FormData(e.target);
    const data = Object.fromEntries(form.entries());

    // Sponsor validation
    if (!/^\d{20}$/.test(data.sponsor_national_id)) return showNotification("Invalid sponsor ID", "error");
    if (!/^\+255\d{9}$/.test(data.sponsor_phone)) return showNotification("Invalid sponsor phone", "error");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.sponsor_email)) return showNotification("Invalid sponsor email", "error");
    if (!sponsorPreview) return showNotification("Upload sponsor photo", "error");

    try {
      const applicationData = {
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
        profile_photo: preview,
        user_data: {
          username: state.tempApplicant.username,
          password: state.tempApplicant.password,
          first_name: state.tempApplicant.name.split(" ")[0],
          last_name: state.tempApplicant.name.split(" ").slice(1).join(" "),
          email: state.tempApplicant.email,
          phone: state.tempApplicant.phone,
          address: state.tempApplicant.address,
          national_id: state.tempApplicant.national_id,
        },
      };

      const response = await api.post("loans/", applicationData);

      if (response.status === 201) {
        showNotification("Application submitted successfully!", "success");
        e.target.reset();
        setPreview(null);
        setSponsorPreview(null);
        setStep(1);
      }
    } catch (err) {
      console.error("Submission error:", err);
      if (err.response) {
        showNotification(
          `Error: ${err.response.status} - ${JSON.stringify(err.response.data)}`,
          "error"
        );
      } else {
        showNotification("Error submitting application", "error");
      }
    }
  };

  return (
    <div className="applicant-form">
      <h2>Loan Application Form</h2>

      {step === 1 && (
        <form onSubmit={handleApplicantSave}>
          <input name="username" placeholder="Username" required />
          <input name="name" placeholder="Full Name" required />
          <input name="address" placeholder="Postal Address" required />
          <input name="national_id" placeholder="National ID" required maxLength="20" />
          <input name="phone" placeholder="Phone (+255XXXXXXXXX)" required maxLength="13" />
          <input name="email" placeholder="Email" />
          <select name="loan_type" required>
            <option value="">Select Loan Type</option>
            <option value="home">Home</option>
            <option value="car">Car</option>
            <option value="education">Education</option>
            <option value="business">Business</option>
          </select>
          <input type="number" name="requested_amount" placeholder="Requested Amount" required min="1" />
          <input type="number" name="assets_value" placeholder="Total Assets Value" required min="1" />
          <input type="number" name="monthly_income" placeholder="Monthly Income" required min="1" />
          <input type="password" name="password" placeholder="Password" required minLength="6" />
          <input type="password" name="confirm_password" placeholder="Confirm Password" required minLength="6" />
          <label>Upload Profile Photo:</label>
          <input type="file" name="profile_photo" accept="image/*" onChange={handleFileChange} required />
          {preview && <img src={preview} alt="Preview" style={{ width: "100px", marginTop: "10px" }} />}
          <button type="submit">Save & Continue</button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleSponsorSubmit}>
          <input name="sponsor_name" placeholder="Sponsor Full Name" required />
          <input name="sponsor_address" placeholder="Sponsor Address" required />
          <input name="sponsor_national_id" placeholder="Sponsor ID" required maxLength="20" />
          <input name="sponsor_phone" placeholder="Sponsor Phone (+255XXXXXXXXX)" required maxLength="13" />
          <input name="sponsor_email" placeholder="Sponsor Email" required />
          <label>Upload Sponsor Photo:</label>
          <input type="file" name="sponsor_photo" accept="image/*" onChange={handleFileChange} required />
          {sponsorPreview && <img src={sponsorPreview} alt="Sponsor Preview" style={{ width: "100px", marginTop: "10px" }} />}
          <button type="submit">Submit Application</button>
        </form>
      )}
    </div>
  );
}
