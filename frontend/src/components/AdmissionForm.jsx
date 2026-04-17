import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { enrollmentsAPI } from '../services/api';
import Toast from './Toast';

const AdmissionForm = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const fileInput = useRef(null);

  const [studentPhoto, setStudentPhoto] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
  const [toast, setToast] = useState(null);

  const [details, setDetails] = useState({
    studentName: '',
    fatherName: '',
    motherName: '',
    birthDay: '',
    birthMonth: '',
    birthYear: '',
    gender: '',
    class: '',
    board: '',
    competitiveCourse: '',
    address: '',
    aadhar: '',
    mobile: '',
  });

  const location = useLocation();
  const editId = new URLSearchParams(location.search).get('edit');
  const isEditing = !!editId;

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    if (editId) loadRecord();
  }, [isAuthenticated, editId]);

  const loadRecord = async () => {
    try {
      setIsSubmitting(true);
      const { enrollment } = await enrollmentsAPI.getById(editId);
      setDetails({
        studentName: enrollment.studentName,
        fatherName: enrollment.fatherName,
        motherName: enrollment.motherName,
        birthDay: enrollment.dateOfBirth.day.toString(),
        birthMonth: enrollment.dateOfBirth.month.toString(),
        birthYear: enrollment.dateOfBirth.year.toString(),
        gender: enrollment.gender,
        class: enrollment.class || '',
        board: enrollment.board || '',
        address: enrollment.address,
        aadhar: enrollment.aadharNumber,
        mobile: enrollment.mobileNumber,
        dateJoined: new Date(enrollment.createdAt).toISOString().split('T')[0],
      });
      setStudentPhoto(enrollment.photo);
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: 'Failed to load existing record',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setToast({
          message: 'Photo size should be less than 2MB',
          type: 'error',
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          const maxSize = 800;
          if (width > height && width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          } else if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          setStudentPhoto(compressedBase64);
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const isOnlyDigits = (str) => {
    for (let i = 0; i < str.length; i++) {
      if (str[i] < '0' || str[i] > '9') return false;
    }
    return true;
  };

  const updateField = (e) => {
    const { name, value } = e.target;

    if (name === 'mobile') {
      if (value.length <= 10 && isOnlyDigits(value)) {
        setDetails({ ...details, [name]: value });
      }
      return;
    }

    if (name === 'birthDay') {
      if (isOnlyDigits(value) && value.length <= 2 && parseInt(value || 0) <= 31) {
        setDetails({ ...details, [name]: value });
      }
      return;
    }

    if (name === 'birthMonth') {
      if (isOnlyDigits(value) && value.length <= 2 && parseInt(value || 0) <= 12) {
        setDetails({ ...details, [name]: value });
      }
      return;
    }

    if (name === 'birthYear') {
      if (isOnlyDigits(value) && value.length <= 4) {
        setDetails({ ...details, [name]: value });
      }
      return;
    }

    setDetails({ ...details, [name]: value });
  };

  const validateDOB = () => {
    const day = parseInt(details.birthDay);
    const month = parseInt(details.birthMonth);
    const year = parseInt(details.birthYear);

    if (!day || !month || !year) return 'Please enter a complete date of birth';
    if (day < 1 || day > 31) return 'Day must be between 1 and 31';
    if (month < 1 || month > 12) return 'Month must be between 1 and 12';
    if (year < 1970 || year > 2020) return 'Year must be between 1970 and 2020';

    const dob = new Date(year, month - 1, day);
    if (dob.getDate() !== day || dob.getMonth() !== month - 1) {
      return `Invalid date: ${day}/${month}/${year} does not exist`;
    }

    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear() - (today < new Date(today.getFullYear(), dob.getMonth(), dob.getDate()) ? 1 : 0);
    if (age < 5) return 'Student must be at least 5 years old';
    if (age > 30) return 'Please enter a valid date of birth';

    return null;
  };

  const onFormSubmit = async (e) => {
    e.preventDefault();

    if (!studentPhoto) {
      setToast({ message: 'Please upload the student photo', type: 'error' });
      window.scrollTo(0, 0);
      return;
    }

    const dobError = validateDOB();
    if (dobError) {
      setToast({ message: dobError, type: 'error' });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage({ type: '', text: '' });

    try {
      const submission = {
        studentName: details.studentName,
        fatherName: details.fatherName,
        motherName: details.motherName,
        dateOfBirth: {
          day: parseInt(details.birthDay),
          month: parseInt(details.birthMonth),
          year: parseInt(details.birthYear),
        },
        gender: details.gender,
        class: details.class,
        board: details.board,
        competitiveCourse: details.competitiveCourse || '',
        address: details.address,
        aadharNumber: details.aadhar,
        mobileNumber: details.mobile,
        photo: studentPhoto,
      };

      const response = isEditing
        ? await enrollmentsAPI.update(editId, submission)
        : await enrollmentsAPI.create(submission);

      if (response.success) {
        if (isEditing) {
          setToast({
            message: 'Form updated successfully! Redirecting...',
            type: 'success',
          });
          window.scrollTo(0, 0);
          setTimeout(() => navigate('/profile'), 2000);
        } else {
          setToast({
            message: 'Enrollment successful! Redirecting...',
            type: 'success',
          });
          window.scrollTo(0, 0);
          setTimeout(() => navigate('/profile'), 2000);
        }
      }
    } catch (err) {
      setToast({
        message: err.response?.data?.message || 'Submission failed. Please try again.',
        type: 'error',
      });
      window.scrollTo(0, 0);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitting && isEditing) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p style={{ marginTop: '20px', color: '#64748b' }}>
          Loading form data...
        </p>
      </div>
    );
  }

  return (
    <section className="admission-page">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="container" style={{ maxWidth: '900px' }}>
        <div className="admission-form-wrapper">
          <div className="admission-form-header">
            <div className="admission-icon-wrapper">
              <i className="fas fa-graduation-cap"></i>
            </div>
            <h2 className="admission-main-title">Admission Form</h2>
            <p className="admission-subtitle">
              Join Success Mantra Institute - Your Path to Excellence
            </p>
          </div>

          <form className="modern-admission-form" onSubmit={onFormSubmit}>
            {statusMessage.text && (
              <div
                className={`modern-alert ${statusMessage.type === 'error' ? 'alert-error' : 'alert-success'}`}
              >
                <i
                  className={`fas ${statusMessage.type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'}`}
                ></i>
                <span>{statusMessage.text}</span>
              </div>
            )}

            <div className="photo-upload-section">
              <label className="photo-upload-label">Student Photo</label>
              <div
                className="photo-upload-box"
                onClick={() => fileInput.current.click()}
              >
                {studentPhoto ? (
                  <img
                    src={studentPhoto}
                    alt="Student"
                    className="uploaded-photo"
                  />
                ) : (
                  <div className="photo-placeholder">
                    <i className="fas fa-camera"></i>
                    <span>Click to Upload Photo</span>
                    <small>JPG, PNG (Max 2MB)</small>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  ref={fileInput}
                  onChange={onFileSelect}
                />
              </div>
            </div>

            <div className="form-section-modern">
              <div className="section-title-bar">
                <i className="fas fa-user-circle"></i>
                <h4>Personal Information</h4>
              </div>

              <div className="form-grid">
                <div className="form-field full-width">
                  <label className="modern-label">
                    Full Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    name="studentName"
                    value={details.studentName}
                    onChange={updateField}
                    placeholder="Enter student's full name"
                    required
                    className="modern-input"
                  />
                </div>

                <div className="form-field">
                  <label className="modern-label">
                    Father's Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    name="fatherName"
                    value={details.fatherName}
                    onChange={updateField}
                    placeholder="Enter father's name"
                    required
                    className="modern-input"
                  />
                </div>

                <div className="form-field">
                  <label className="modern-label">
                    Mother's Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    name="motherName"
                    value={details.motherName}
                    onChange={updateField}
                    placeholder="Enter mother's name"
                    required
                    className="modern-input"
                  />
                </div>

                <div className="form-field">
                  <label className="modern-label">
                    Date of Birth <span className="required">*</span>
                  </label>
                  <div className="dob-inputs">
                    <input
                      type="text"
                      name="birthDay"
                      value={details.birthDay}
                      onChange={updateField}
                      placeholder="DD"
                      maxLength="2"
                      required
                      className="modern-input"
                      inputMode="numeric"
                    />
                    <input
                      type="text"
                      name="birthMonth"
                      value={details.birthMonth}
                      onChange={updateField}
                      placeholder="MM"
                      maxLength="2"
                      required
                      className="modern-input"
                      inputMode="numeric"
                    />
                    <input
                      type="text"
                      name="birthYear"
                      value={details.birthYear}
                      onChange={updateField}
                      placeholder="YYYY"
                      maxLength="4"
                      required
                      className="modern-input"
                      inputMode="numeric"
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label className="modern-label">
                    Gender <span className="required">*</span>
                  </label>
                  <div className="gender-options">
                    <label className="gender-option">
                      <input
                        type="radio"
                        name="gender"
                        value="male"
                        checked={details.gender === 'male'}
                        onChange={updateField}
                        required
                      />
                      <span className="gender-label">
                        <i className="fas fa-mars"></i> Male
                      </span>
                    </label>
                    <label className="gender-option">
                      <input
                        type="radio"
                        name="gender"
                        value="female"
                        checked={details.gender === 'female'}
                        onChange={updateField}
                        required
                      />
                      <span className="gender-label">
                        <i className="fas fa-venus"></i> Female
                      </span>
                    </label>
                  </div>
                </div>

                <div className="form-field">
                  <label className="modern-label">
                    Class <span className="required">*</span>
                  </label>
                  <select
                    name="class"
                    value={details.class}
                    onChange={updateField}
                    required
                    className="modern-input"
                  >
                    <option value="">Select Class</option>
                    <option value="1">Class 1st</option>
                    <option value="2">Class 2nd</option>
                    <option value="3">Class 3rd</option>
                    <option value="4">Class 4th</option>
                    <option value="5">Class 5th</option>
                    <option value="6">Class 6th</option>
                    <option value="7">Class 7th</option>
                    <option value="8">Class 8th</option>
                    <option value="9">Class 9th</option>
                    <option value="10">Class 10th</option>
                    <option value="11">Class 11th</option>
                    <option value="12">Class 12th</option>
                    <option value="12th Pass">12th Pass</option>
                  </select>
                </div>

                <div className="form-field">
                  <label className="modern-label">
                    Board{' '}
                    {details.class !== '12th Pass' && (
                      <span className="required">*</span>
                    )}
                  </label>
                  <select
                    name="board"
                    value={details.board}
                    onChange={updateField}
                    required={details.class !== '12th Pass'}
                    disabled={details.class === '12th Pass'}
                    className="modern-input"
                  >
                    <option value="">Select Board</option>
                    <option value="CBSE">CBSE</option>
                    <option value="ICSE">ICSE</option>
                    <optgroup label="State Boards">
                      <option value="Andhra Pradesh Board">Andhra Pradesh Board</option>
                      <option value="Arunachal Pradesh Board">Arunachal Pradesh Board</option>
                      <option value="Assam Board">Assam Board</option>
                      <option value="Bihar Board">Bihar Board</option>
                      <option value="Chhattisgarh Board">Chhattisgarh Board</option>
                      <option value="Goa Board">Goa Board</option>
                      <option value="Gujarat Board">Gujarat Board</option>
                      <option value="Haryana Board">Haryana Board</option>
                      <option value="Himachal Pradesh Board">Himachal Pradesh Board</option>
                      <option value="Jharkhand Board">Jharkhand Board</option>
                      <option value="Karnataka Board">Karnataka Board</option>
                      <option value="Kerala Board">Kerala Board</option>
                      <option value="Madhya Pradesh Board">Madhya Pradesh Board</option>
                      <option value="Maharashtra Board">Maharashtra Board</option>
                      <option value="Manipur Board">Manipur Board</option>
                      <option value="Meghalaya Board">Meghalaya Board</option>
                      <option value="Mizoram Board">Mizoram Board</option>
                      <option value="Nagaland Board">Nagaland Board</option>
                      <option value="Odisha Board">Odisha Board</option>
                      <option value="Punjab Board">Punjab Board</option>
                      <option value="Rajasthan Board">Rajasthan Board</option>
                      <option value="Sikkim Board">Sikkim Board</option>
                      <option value="Tamil Nadu Board">Tamil Nadu Board</option>
                      <option value="Telangana Board">Telangana Board</option>
                      <option value="Tripura Board">Tripura Board</option>
                      <option value="Uttar Pradesh Board">Uttar Pradesh Board</option>
                      <option value="Uttarakhand Board">Uttarakhand Board</option>
                      <option value="West Bengal Board">West Bengal Board</option>
                    </optgroup>
                  </select>
                </div>

                {details.class === '12th Pass' && (
                  <div className="form-field full-width">
                    <label className="modern-label">
                      Competitive Course <span className="required">*</span>
                    </label>
                    <select
                      name="competitiveCourse"
                      value={details.competitiveCourse}
                      onChange={updateField}
                      required
                      className="modern-input"
                    >
                      <option value="">Select Course</option>
                      <optgroup label="Govt Job Exams">
                        <option value="SSC">SSC</option>
                        <option value="Banking">Banking</option>
                        <option value="Teaching">Teaching</option>
                        <option value="Judiciary">Judiciary</option>
                      </optgroup>
                      <optgroup label="Defence">
                        <option value="NDA">NDA</option>
                        <option value="CDS">CDS</option>
                        <option value="AFCAT">AFCAT</option>
                        <option value="Agniveer">Agniveer</option>
                      </optgroup>
                      <optgroup label="UPSC">
                        <option value="Civil Services">Civil Services</option>
                      </optgroup>
                    </select>
                  </div>
                )}

                <div className="form-field full-width">
                  <label className="modern-label">
                    Address <span className="required">*</span>
                  </label>
                  <textarea
                    name="address"
                    value={details.address}
                    onChange={updateField}
                    placeholder="Enter complete address"
                    rows="3"
                    required
                    className="modern-input"
                  />
                </div>

                <div className="form-field">
                  <label className="modern-label">
                    Aadhar Number <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    name="aadhar"
                    value={details.aadhar}
                    onChange={updateField}
                    placeholder="Enter 12-digit Aadhar"
                    pattern="[0-9]{12}"
                    maxLength="12"
                    inputMode="numeric"
                    required
                    className="modern-input"
                  />
                </div>

                <div className="form-field">
                  <label className="modern-label">
                    Mobile Number <span className="required">*</span>
                  </label>
                  <input
                    type="tel"
                    name="mobile"
                    value={details.mobile}
                    onChange={updateField}
                    onKeyDown={(e) => {
                      if (e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-' || e.key === '.') {
                        e.preventDefault();
                      }
                    }}
                    placeholder="Enter 10-digit mobile"
                    pattern="[0-9]{10}"
                    inputMode="numeric"
                    required
                    className="modern-input"
                  />
                </div>
              </div>
            </div>

            <div className="declaration-box">
              <div className="declaration-icon">
                <i className="fas fa-file-contract"></i>
              </div>
              <div className="declaration-content">
                <h5>Declaration</h5>
                <p>
                  कोचिंग के नियमो का पालन करना होगा एवं अनुशासन में रहना होगा।
                  यदि आप कोचिंग के नियमो का उल्लंघन करते है तो आपका नाम निरस्त
                  कर दिया जायेगा।
                </p>
              </div>
            </div>

            <button
              type="submit"
              className="submit-btn-modern"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Processing...
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane"></i> Submit Admission Form
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default AdmissionForm;
