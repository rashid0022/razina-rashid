import { useState } from "react";

export default function ApplyLoan({ state, setState, showNotification }) {
  const [preview, setPreview] = useState(null);
  const [sponsorPreview, setSponsorPreview] = useState(null);
  const [step, setStep] = useState(1);

  // Convert uploaded file to Base64 string
  const fileToBase64 = (file, callback) => {
    const reader = new FileReader();
    reader.onloadend = () => callback(reader.result);
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    fileToBase64(file, (base64) => {
      if (e.target.name === "profilePhoto") {
        setPreview(base64);
        setState((prev) => ({
          ...prev,
          tempApplicant: { ...prev.tempApplicant, profilePhoto: base64 },
        }));
      } else if (e.target.name === "sponsorPhoto") {
        setSponsorPreview(base64);
        setState((prev) => ({
          ...prev,
          tempApplicant: { ...prev.tempApplicant, sponsorPhoto: base64 },
        }));
      }
    });
  };

  const handleApplicantSave = (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const data = Object.fromEntries(form.entries());

    if (!/^\d{20}$/.test(data.nationalId)) {
      return showNotification(
        "Invalid National ID. Must be exactly 20 digits.",
        "error"
      );
    }

    if (!/^\+255\d{9}$/.test(data.phone)) {
      return showNotification(
        "Invalid phone number. Must be in format +255XXXXXXXXX.",
        "error"
      );
    }

    if (data.password !== data.confirmPassword) {
      return showNotification("Passwords do not match.", "error");
    }

    if (isNaN(data.assetsValue) || Number(data.assetsValue) <= 0) {
      return showNotification(
        "Total Assets Value must be greater than 0.",
        "error"
      );
    }

    if (isNaN(data.monthlyIncome) || Number(data.monthlyIncome) <= 0) {
      return showNotification(
        "Monthly Income must be greater than 0.",
        "error"
      );
    }

    if (!preview) {
      return showNotification("Please upload your passport/photo.", "error");
    }

    setState((prev) => ({
      ...prev,
      tempApplicant: { ...data, profilePhoto: preview },
      users: {
        ...prev.users,
        [data.name]: { password: data.password }, // username = full name
      },
    }));

    setStep(2);
  };

  const handleSponsorSubmit = (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const data = Object.fromEntries(form.entries());

    if (!/^\d{20}$/.test(data.sponsorNationalId)) {
      return showNotification("Invalid sponsor National ID.", "error");
    }

    if (!/^\+255\d{9}$/.test(data.sponsorPhone)) {
      return showNotification("Invalid sponsor phone number.", "error");
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.sponsorEmail)) {
      return showNotification("Invalid sponsor email.", "error");
    }

    if (!sponsorPreview) {
      return showNotification("Please upload sponsor passport/photo.", "error");
    }

    const application = {
      id: Date.now().toString(),
      ...state.tempApplicant,
      ...data,
      sponsorPhoto: sponsorPreview,
      status: "pending",
    };

    setState((prev) => ({
      ...prev,
      applications: [...prev.applications, application],
      tempApplicant: null,
    }));

    showNotification("Application submitted successfully!", "success");
    e.target.reset();
    setPreview(null);
    setSponsorPreview(null);
    setStep(1);
  };

  return (
    <div className="applicant-form">
      <h2>Loan Application Form</h2>

      {step === 1 && (
        <form onSubmit={handleApplicantSave}>
          <h3>Applicant Information</h3>
          <input name="name" placeholder="Full Name" required />
          <input name="address" placeholder="Postal Address" required />
          <input
            type="text"
            name="nationalId"
            placeholder="National ID (20 digits)"
            required
            maxLength="20"
          />
          <input
            type="text"
            name="phone"
            placeholder="Phone Number (+255XXXXXXXXX)"
            required
            maxLength="13"
          />
          <select name="loanType" required>
            <option value="">Select Loan Type</option>
            <option value="home">Home</option>
            <option value="car">Car</option>
            <option value="education">Education</option>
            <option value="business">Business</option>
          </select>

          <input
            type="number"
            name="assetsValue"
            placeholder="Total Assets Value"
            required
            min="1"
          />
          <input
            type="number"
            name="monthlyIncome"
            placeholder="Monthly Income"
            required
            min="1"
          />

          <input
            type="password"
            name="password"
            placeholder="Create Password"
            required
            minLength="6"
          />

          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            required
            minLength="6"
          />
          <label>Upload Passport / Profile Photo:</label>
          <input
            type="file"
            name="profilePhoto"
            accept="image/*"
            onChange={handleFileChange}
            required
          />
          {preview && (
            <img
              src={preview}
              alt="Preview"
              style={{ width: "100px", marginTop: "10px" }}
            />
          )}
          <button type="submit">Save & Continue</button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleSponsorSubmit}>
          <h3>Sponsor Information</h3>
          <input name="sponsorName" placeholder="Sponsor Full Name" required />
          <input
            name="sponsorAddress"
            placeholder="Sponsor Postal Address"
            required
          />
          <input
            type="text"
            name="sponsorNationalId"
            placeholder="Sponsor National ID (20 digits)"
            required
            maxLength="20"
          />
          <input
            type="text"
            name="sponsorPhone"
            placeholder="Sponsor Phone Number (+255XXXXXXXXX)"
            required
            maxLength="13"
          />
          <input
            type="email"
            name="sponsorEmail"
            placeholder="Sponsor Email Address"
            required
          />
          <label>Upload Sponsor Passport / Profile Photo:</label>
          <input
            type="file"
            name="sponsorPhoto"
            accept="image/*"
            onChange={handleFileChange}
            required
          />
          {sponsorPreview && (
            <img
              src={sponsorPreview}
              alt="Sponsor Preview"
              style={{ width: "100px", marginTop: "10px" }}
            />
          )}
          <button type="submit">Submit Application</button>
        </form>
      )}
    </div>
  );
}
