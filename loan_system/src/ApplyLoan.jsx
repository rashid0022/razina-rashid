import { useState } from "react";
import { applyLoan, fetchCSRF } from "./api";

export default function ApplyLoan({ currentUser, showNotification, setPage }) {
  const [step, setStep] = useState(1);
  const [preview, setPreview] = useState(null);
  const [sponsorPreview, setSponsorPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({});

  // Convert file to base64
  const fileToBase64 = (file, callback) => {
    const reader = new FileReader();
    reader.onloadend = () => callback(reader.result);
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    fileToBase64(file, (base64) => {
      if (e.target.name === "profile_photo") setPreview(base64);
      if (e.target.name === "sponsor_photo") setSponsorPreview(base64);
    });
  };

  // Step 1: Applicant Info
  const handleApplicantSave = (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());

    if (!preview) return showNotification("Upload your photo", "error");
    if (data.national_id.length !== 20)
      return showNotification("National ID must be 20 chars", "error");
    if (data.phone.length !== 10)
      return showNotification("Phone must be 10 digits", "error");

    const [firstName, ...rest] = data.name.trim().split(" ");
    const lastName = rest.join(" ") || firstName;

    setFormData({
      first_name: firstName,
      last_name: lastName,
      address: data.address,
      national_id: data.national_id,
      phone: data.phone,
      email: data.email,
      loan_type: data.loan_type,
      requested_amount: Number(data.requested_amount),
      assets_value: Number(data.assets_value),
      monthly_income: Number(data.monthly_income),
      profile_photo: preview
    });

    setStep(2);
  };

  // Step 2: Sponsor + Submit
  const handleSponsorSubmit = async (e) => {
    e.preventDefault();
    if (!sponsorPreview) return showNotification("Upload sponsor photo", "error");

    const sponsorData = Object.fromEntries(new FormData(e.target).entries());

    const payload = {
      ...formData,
      sponsor_name: sponsorData.sponsor_name,
      sponsor_address: sponsorData.sponsor_address,
      sponsor_national_id: sponsorData.sponsor_national_id,
      sponsor_phone: sponsorData.sponsor_phone,
      sponsor_email: sponsorData.sponsor_email,
      sponsor_photo: sponsorPreview
    };

    setIsSubmitting(true);

    try {
      await fetchCSRF();  // ensure CSRF cookie is set
      const res = await applyLoan(payload);

      if (res.status === 201) {
        showNotification("Loan application submitted!", "success");
        setPage("dashboard");
      }
    } catch (err) {
      console.error(err.response?.data || err);
      showNotification("Failed to submit loan", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="apply-container">
      {step === 1 && (
        <form onSubmit={handleApplicantSave}>
          <h3>Applicant Info</h3>
          <input name="name" placeholder="Full Name" required />
          <input name="address" placeholder="Address" required />
          <input name="national_id" maxLength={20} placeholder="National ID" required />
          <input name="phone" maxLength={10} placeholder="Phone" required />
          <input name="email" type="email" placeholder="Email" />
          <select name="loan_type" required>
            <option value="">Select Loan Type</option>
            <option value="home">Home</option>
            <option value="car">Car</option>
            <option value="education">Education</option>
            <option value="business">Business</option>
          </select>
          <input type="number" name="requested_amount" placeholder="Requested Amount" required />
          <input type="number" name="assets_value" placeholder="Assets Value" required />
          <input type="number" name="monthly_income" placeholder="Monthly Income" required />
          <label>Upload Profile Photo:</label>
          <input type="file" name="profile_photo" onChange={handleFileChange} required />
          <button type="submit">Next</button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleSponsorSubmit}>
          <h3>Sponsor Info</h3>
          <input name="sponsor_name" placeholder="Sponsor Name" required />
          <input name="sponsor_address" placeholder="Sponsor Address" required />
          <input name="sponsor_national_id" placeholder="Sponsor ID" required />
          <input name="sponsor_phone" placeholder="Sponsor Phone" required />
          <input name="sponsor_email" type="email" placeholder="Sponsor Email" required />
          <label>Upload Sponsor Photo:</label>
          <input type="file" name="sponsor_photo" onChange={handleFileChange} required />
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Loan"}
          </button>
        </form>
      )}
    </div>
  );
}
