
import { useRef, useState } from "react";
import axios from "axios";
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  Mic,
  ShieldCheck,
  Trash2,
  Upload,
  AlertCircle,
  LoaderCircle,
  CheckCircle2,
  Image as ImageIcon,
  ScanSearch,
} from "lucide-react";

// ==========================================
// TYPES
// ==========================================

interface ComplaintAnalysis {
  problem_summary: string;
  language: string;
  category: string;
  duration: string | null;
  urgency: string;
  suggested_department: string | null;
  location: string | null;
  missing_information: string[];
  needs_clarification: boolean;
}

interface YoloDetection {
  class: string;
  confidence: number;
  bbox_xyxy?: number[];
}

interface ImageAnalysis {
  issue_detected: boolean;
  category: string;
  visible_objects: string[];
  visible_condition: string;
  evidence_observations: string[];
  limitations: string[];
  needs_human_review: boolean;

  ai_models?: {
    gemini?: {
      category?: string;
    };
    yolo?: {
      detection_count?: number;
      detections?: YoloDetection[];
    };
  };

  yolo_categories?: string[];
  model_agreement?: boolean;
  complaint_evidence_match?: string;

  evidence_comparison?: {
    match_status?: string;
    reason?: string;
    supporting_observations?: string[];
    conflicting_observations?: string[];
    needs_human_review?: boolean;
  };
}

interface Registration {
  ticket_id: string;
  assigned_department: string | null;
  routing_status: string;
  status: string;
}

// ==========================================
// CONFIGURATION
// ==========================================

const API_URL = "http://127.0.0.1:5000";
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

// ==========================================
// COMPONENT
// ==========================================

function ReportSection() {
  const [complaint, setComplaint] = useState("");
  const [location, setLocation] = useState("");
  const [language, setLanguage] = useState("English");

  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState("");

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const [analysis, setAnalysis] =
    useState<ComplaintAnalysis | null>(null);

  const [imageAnalysis, setImageAnalysis] =
    useState<ImageAnalysis | null>(null);

  // Voice input state
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Registration state
  const [registering, setRegistering] = useState(false);
  const [registration, setRegistration] =
    useState<Registration | null>(null);

  // ==========================================
  // IMAGE UPLOAD
  // ==========================================

  const handleImage = (file?: File) => {
    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("Please select a JPG, PNG or WEBP image.");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setError("Image must be smaller than 10 MB.");
      return;
    }

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setError("");
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setPreview("");
    setImage(null);
    setError("");
  };

  // ==========================================
  // VOICE INPUT
  // ==========================================

  const startVoiceInput = () => {
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setError(
        "Voice recognition is not supported in this browser. Please use Chrome or Edge."
      );
      return;
    }

    // Stop listening if already active
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    setError("");

    const recognition = new SpeechRecognitionAPI();

    const languageCodes: Record<string, string> = {
      English: "en-IN",
      Hindi: "hi-IN",
      Marathi: "mr-IN",
      Hinglish: "hi-IN",
    };

    recognition.lang = languageCodes[language] || "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;

      setComplaint((previous) =>
        previous.trim()
          ? `${previous.trim()} ${transcript}`
          : transcript
      );
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);

      if (event.error === "not-allowed") {
        setError(
          "Please allow microphone access in your browser."
        );
      } else if (event.error === "no-speech") {
        setError("No speech detected. Please try again.");
      } else {
        setError(`Voice recognition error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch {
      setIsListening(false);
      setError("Could not start microphone. Please try again.");
    }
  };

  // ==========================================
  // AI ANALYSIS
  // ==========================================

  const handleContinue = async () => {
    if (!complaint.trim()) {
      setError("Please describe your civic issue first.");
      return;
    }

    if (loading) return;

    setLoading(true);
    setError("");
    setAnalysis(null);
    setImageAnalysis(null);
    setRegistration(null);

    try {
      const complaintWithLocation = location.trim()
        ? `${complaint.trim()}\nReported location: ${location.trim()}`
        : complaint.trim();

      // STEP 1: Analyze complaint text
      const textResponse = await axios.post(
        `${API_URL}/api/ai/analyze-text`,
        {
          complaint: complaintWithLocation,
        }
      );

      if (
        !textResponse.data.success ||
        !textResponse.data.analysis
      ) {
        throw new Error(
          "The AI could not analyze your complaint."
        );
      }

      const textResult: ComplaintAnalysis =
        textResponse.data.analysis;

      // STEP 2: Analyze uploaded image, if provided
      let imageResult: ImageAnalysis | null = null;

      if (image) {
        const formData = new FormData();

        formData.append("complaint", complaintWithLocation);
        formData.append("image", image);

        const imageResponse = await axios.post(
          `${API_URL}/api/ai/analyze-image`,
          formData
        );

        if (
          !imageResponse.data.success ||
          !imageResponse.data.image_analysis
        ) {
          throw new Error(
            "Image evidence could not be analyzed."
          );
        }

        imageResult = imageResponse.data.image_analysis;
      }

      // STEP 3: Display results
      setAnalysis(textResult);
      setImageAnalysis(imageResult);
      setSubmitted(true);
    } catch (err) {
      console.error("Complaint analysis error:", err);

      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.error ||
            "Could not connect to the AI server. Check whether Flask is running."
        );
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // REGISTER COMPLAINT
  // ==========================================

  const handleRegisterComplaint = async () => {
    if (!analysis) {
      setError("Please analyze your complaint first.");
      return;
    }

    if (analysis.needs_clarification) {
      setError(
        "Please provide the missing information before registering."
      );
      return;
    }

    if (registration || registering) {
      return;
    }

    setRegistering(true);
    setError("");

    try {
      const response = await axios.post(
        `${API_URL}/api/complaints/register`,
        {
          complaint: complaint.trim(),
          location: location.trim(),
          language,
          analysis,
          image_analysis: imageAnalysis,
        }
      );

      if (
        !response.data.success ||
        !response.data.ticket_id
      ) {
        throw new Error(
          response.data.error ||
            "Complaint registration failed."
        );
      }

      setRegistration({
        ticket_id: response.data.ticket_id,
        assigned_department:
          response.data.assigned_department || null,
        routing_status:
          response.data.routing_status || "manual_review",
        status: response.data.status || "Submitted - Demo",
      });
    } catch (err) {
      console.error("Complaint registration error:", err);

      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.error ||
            "Could not register complaint. Check whether Flask is running."
        );
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Registration failed. Please try again.");
      }
    } finally {
      setRegistering(false);
    }
  };

  // ==========================================
  // EDIT COMPLAINT
  // ==========================================

  const handleEdit = () => {
    if (registration) return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }

    setSubmitted(false);
    setError("");
    setAnalysis(null);
    setImageAnalysis(null);
  };

  // ==========================================
  // UI HELPERS
  // ==========================================

  const getMatchColor = (status?: string) => {
    if (status === "Consistent") {
      return "border-teal-200 bg-teal-50 text-teal-800";
    }

    if (status === "Mismatch") {
      return "border-red-200 bg-red-50 text-red-800";
    }

    return "border-amber-200 bg-amber-50 text-amber-800";
  };

  const needsHumanReview = Boolean(
    imageAnalysis?.needs_human_review ||
      imageAnalysis?.evidence_comparison?.needs_human_review ||
      imageAnalysis?.model_agreement === false ||
      imageAnalysis?.complaint_evidence_match === "Mismatch"
  );

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <section id="report" className="bg-slate-50 px-6 py-20">
      <div className="mx-auto max-w-4xl">

        {/* BACK TO HOME */}

        <a
          href="#home"
          className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-blue-800"
        >
          <ArrowLeft size={17} />
          Back to Home
        </a>

        {/* HEADER */}

        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-800">
            <ShieldCheck size={30} />
          </div>

          <p className="text-sm font-bold uppercase tracking-widest text-teal-700">
            JanSahayak AI
          </p>

          <h2 className="mt-3 text-3xl font-extrabold text-slate-950 md:text-4xl">
            Report a Civic Issue
          </h2>

          <p className="mt-4 text-slate-600">
            Tell us what is happening in your area.
            We'll help you prepare your complaint.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 md:p-10">

          {/* ================================== */}
          {/* FORM SCREEN */}
          {/* ================================== */}

          {!submitted ? (
            <>
              {/* LANGUAGE */}

              <div className="mb-8">
                <label className="mb-3 block font-bold text-slate-800">
                  1. Select your preferred language
                </label>

                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-4 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                >
                  <option>English</option>
                  <option>Hindi</option>
                  <option>Marathi</option>
                  <option>Hinglish</option>
                </select>
              </div>

              {/* COMPLAINT */}

              <div className="mb-8">
                <label className="mb-3 block font-bold text-slate-800">
                  2. Describe your problem
                </label>

                <textarea
                  value={complaint}
                  onChange={(e) => setComplaint(e.target.value)}
                  placeholder="Example: Garbage has not been collected from my area for three days..."
                  rows={5}
                  className="w-full resize-y rounded-xl border border-slate-300 p-4 leading-7 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                />

                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-slate-500">
                    Describe the problem in your own words.
                  </p>

                  <button
                    type="button"
                    onClick={startVoiceInput}
                    className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                      isListening
                        ? "bg-red-100 text-red-700"
                        : "bg-blue-50 text-blue-800 hover:bg-blue-100"
                    }`}
                  >
                    <Mic size={17} />
                    {isListening
                      ? "Stop listening"
                      : "Speak complaint"}
                  </button>
                </div>

                {isListening && (
                  <p className="mt-2 text-sm font-medium text-red-600">
                    Listening... Speak clearly into your microphone.
                  </p>
                )}
              </div>

              {/* LOCATION */}

              <div className="mb-8">
                <label className="mb-3 block font-bold text-slate-800">
                  3. Where is the problem?
                </label>

                <div className="relative">
                  <MapPin
                    className="absolute left-4 top-4 text-slate-400"
                    size={19}
                  />

                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Enter area, street or landmark"
                    className="w-full rounded-xl border border-slate-300 py-4 pl-12 pr-4 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              {/* IMAGE UPLOAD */}

              <div className="mb-9">
                <label className="mb-3 block font-bold text-slate-800">
                  4. Upload photo evidence
                </label>

                <label className="flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center transition hover:border-blue-500 hover:bg-blue-50">
                  <Upload
                    className="mb-3 text-blue-700"
                    size={30}
                  />

                  <span className="font-semibold text-slate-800">
                    Click to upload an image
                  </span>

                  <span className="mt-2 text-xs text-slate-500">
                    JPG, PNG or WEBP · Maximum 10 MB
                  </span>

                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) =>
                      handleImage(e.target.files?.[0])
                    }
                  />
                </label>

                {preview && (
                  <div className="mt-4 flex items-start gap-4 rounded-xl border border-slate-200 p-3">
                    <img
                      src={preview}
                      alt="Selected evidence"
                      className="h-24 w-24 rounded-lg object-cover"
                    />

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-800">
                        {image?.name}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {image
                          ? (image.size / 1024).toFixed(1) + " KB"
                          : ""}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={removeImage}
                      className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                      aria-label="Remove image"
                    >
                      <Trash2 size={19} />
                    </button>
                  </div>
                )}
              </div>

              {/* ERROR */}

              {error && (
                <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  <AlertCircle
                    size={20}
                    className="mt-0.5 shrink-0"
                  />
                  <p>{error}</p>
                </div>
              )}

              {/* SUBMIT */}

              <button
                type="button"
                onClick={handleContinue}
                disabled={loading || isListening}
                className="flex w-full items-center justify-center gap-3 rounded-xl bg-blue-800 px-6 py-4 font-bold text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <LoaderCircle
                      size={20}
                      className="animate-spin"
                    />
                    AI is analyzing your evidence...
                  </>
                ) : (
                  <>
                    Continue to AI Analysis
                    <ArrowRight size={19} />
                  </>
                )}
              </button>

              <p className="mt-4 text-center text-xs text-slate-500">
                Your complaint will not be registered until you review and confirm it.
              </p>
            </>

          ) : (

            /* ================================== */
            /* RESULTS SCREEN */
            /* ================================== */

            <div className="py-4">

              {/* RESULT HEADER */}

              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-teal-100 text-teal-700">
                  <ShieldCheck size={34} />
                </div>

                <h3 className="mt-5 text-2xl font-extrabold text-slate-900">
                  AI Analysis Complete
                </h3>

                <p className="mt-3 text-slate-600">
                  Review the complaint and evidence analysis below.
                </p>
              </div>

              {/* TEXT ANALYSIS */}

              {analysis && (
                <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-center gap-2 text-teal-700">
                    <CheckCircle2 size={20} />
                    <p className="font-bold">
                      Complaint Analysis
                    </p>
                  </div>

                  <p className="mt-3 leading-7 text-slate-800">
                    {analysis.problem_summary}
                  </p>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">

                    <div>
                      <p className="text-xs font-bold uppercase text-slate-500">
                        Category
                      </p>
                      <p className="mt-2 font-semibold text-slate-800">
                        {analysis.category}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase text-slate-500">
                        Urgency
                      </p>
                      <p className="mt-2 font-semibold text-slate-800">
                        {analysis.urgency}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase text-slate-500">
                        Duration
                      </p>
                      <p className="mt-2 font-semibold text-slate-800">
                        {analysis.duration || "Not specified"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase text-slate-500">
                        Suggested department
                      </p>
                      <p className="mt-2 font-semibold text-slate-800">
                        {analysis.suggested_department ||
                          "Manual review required"}
                      </p>
                    </div>

                    <div className="sm:col-span-2">
                      <p className="text-xs font-bold uppercase text-slate-500">
                        Location
                      </p>
                      <p className="mt-2 font-semibold text-slate-800">
                        {analysis.location ||
                          location ||
                          "Not provided"}
                      </p>
                    </div>
                  </div>

                  {/* CLARIFICATION */}

                  {analysis.needs_clarification && (
                    <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-5">
                      <div className="flex items-center gap-2 font-bold text-amber-800">
                        <AlertCircle size={20} />
                        More information required
                      </div>

                      <p className="mt-2 text-sm leading-6 text-amber-800">
                        Please provide the missing information before your complaint can be finalized.
                      </p>

                      {analysis.missing_information?.length > 0 && (
                        <ul className="mt-3 list-inside list-disc text-sm text-amber-900">
                          {analysis.missing_information.map(
                            (item, index) => (
                              <li key={index}>{item}</li>
                            )
                          )}
                        </ul>
                      )}
                    </div>
                  )}

                  {!analysis.needs_clarification && (
                    <div className="mt-5 rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm text-teal-800">
                      The AI has not identified any missing information.
                    </div>
                  )}
                </div>
              )}

              {/* IMAGE ANALYSIS */}

              {imageAnalysis && (
                <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">

                  <div className="flex items-center gap-2 text-blue-800">
                    <ScanSearch size={21} />
                    <h4 className="font-bold">
                      Photo Evidence Analysis
                    </h4>
                  </div>

                  {/* IMAGE CATEGORY */}

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-xs font-bold uppercase text-slate-500">
                        Gemini image category
                      </p>
                      <p className="mt-2 font-semibold text-slate-800">
                        {imageAnalysis.category || "Not identified"}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-xs font-bold uppercase text-slate-500">
                        YOLO detection count
                      </p>
                      <p className="mt-2 font-semibold text-slate-800">
                        {imageAnalysis.ai_models?.yolo?.detection_count ?? 0}
                      </p>
                    </div>
                  </div>

                  {/* VISIBLE CONDITION */}

                  {imageAnalysis.visible_condition && (
                    <div className="mt-5">
                      <p className="text-xs font-bold uppercase text-slate-500">
                        Visible condition
                      </p>
                      <p className="mt-2 leading-7 text-slate-700">
                        {imageAnalysis.visible_condition}
                      </p>
                    </div>
                  )}

                  {/* YOLO DETECTIONS */}

                  <div className="mt-5">
                    <p className="font-bold text-slate-800">
                      YOLO object detections
                    </p>

                    {imageAnalysis.ai_models?.yolo?.detections?.length ? (
                      <div className="mt-3 space-y-2">
                        {imageAnalysis.ai_models.yolo.detections.map(
                          (detection, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-3"
                            >
                              <span className="font-medium text-slate-800">
                                {detection.class}
                              </span>

                              <span className="text-sm font-semibold text-blue-800">
                                {(detection.confidence * 100).toFixed(1)}%
                                confidence
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-slate-500">
                        YOLO did not detect any trained civic issue objects.
                      </p>
                    )}
                  </div>

                  {/* MODEL AGREEMENT */}

                  <div className="mt-5 rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase text-slate-500">
                      Gemini and YOLO category agreement
                    </p>

                    <p className="mt-2 font-semibold text-slate-800">
                      {imageAnalysis.model_agreement === true
                        ? "Both models agree on the detected category."
                        : imageAnalysis.model_agreement === false
                          ? "The models disagree. Further review is needed."
                          : "Agreement could not be established."}
                    </p>
                  </div>

                  {/* EVIDENCE COMPARISON */}

                  <div
                    className={`mt-5 rounded-xl border p-4 ${getMatchColor(
                      imageAnalysis.complaint_evidence_match
                    )}`}
                  >
                    <p className="text-xs font-bold uppercase">
                      Complaint and photo consistency
                    </p>

                    <p className="mt-2 text-lg font-extrabold">
                      {imageAnalysis.complaint_evidence_match ||
                        imageAnalysis.evidence_comparison?.match_status ||
                        "Unclear"}
                    </p>

                    <p className="mt-2 text-sm leading-6">
                      {imageAnalysis.evidence_comparison?.reason ||
                        "No comparison explanation was returned."}
                    </p>
                  </div>

                  {/* SUPPORTING OBSERVATIONS */}

                  {imageAnalysis.evidence_comparison
                    ?.supporting_observations?.length ? (
                    <div className="mt-5">
                      <p className="font-bold text-slate-800">
                        Supporting observations
                      </p>

                      <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-700">
                        {imageAnalysis.evidence_comparison.supporting_observations.map(
                          (item, index) => (
                            <li key={index}>{item}</li>
                          )
                        )}
                      </ul>
                    </div>
                  ) : null}

                  {/* CONFLICTING OBSERVATIONS */}

                  {imageAnalysis.evidence_comparison
                    ?.conflicting_observations?.length ? (
                    <div className="mt-5">
                      <p className="font-bold text-red-800">
                        Conflicting observations
                      </p>

                      <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-red-700">
                        {imageAnalysis.evidence_comparison.conflicting_observations.map(
                          (item, index) => (
                            <li key={index}>{item}</li>
                          )
                        )}
                      </ul>
                    </div>
                  ) : null}

                  {/* LIMITATIONS */}

                  {imageAnalysis.limitations?.length > 0 && (
                    <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
                      <p className="font-bold text-amber-900">
                        Analysis limitations
                      </p>

                      <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-amber-800">
                        {imageAnalysis.limitations.map(
                          (item, index) => (
                            <li key={index}>{item}</li>
                          )
                        )}
                      </ul>
                    </div>
                  )}

                  {/* HUMAN REVIEW */}

                  <div
                    className={`mt-5 flex items-start gap-3 rounded-xl p-4 ${
                      needsHumanReview
                        ? "bg-amber-50 text-amber-900"
                        : "bg-teal-50 text-teal-800"
                    }`}
                  >
                    {needsHumanReview ? (
                      <AlertCircle
                        className="mt-0.5 shrink-0"
                        size={21}
                      />
                    ) : (
                      <CheckCircle2
                        className="mt-0.5 shrink-0"
                        size={21}
                      />
                    )}

                    <div>
                      <p className="font-bold">
                        {needsHumanReview
                          ? "Human review recommended"
                          : "No human review flag raised"}
                      </p>

                      <p className="mt-1 text-sm leading-6">
                        {needsHumanReview
                          ? "The evidence has been flagged for further verification. AI results should not be treated as proof of authenticity or fraud."
                          : "The AI checks did not raise a human-review flag. This does not guarantee that the image is authentic."}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* NO IMAGE */}

              {!imageAnalysis && (
                <div className="mt-5 flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                  <ImageIcon
                    size={20}
                    className="mt-0.5 shrink-0"
                  />
                  No photo was uploaded. Only the complaint text was analyzed.
                </div>
              )}

              {/* ================================== */}
              {/* REGISTRATION RESULT */}
              {/* ================================== */}

              {registration ? (
                <div className="mt-6 rounded-2xl border border-teal-200 bg-teal-50 p-6">

                  <div className="flex items-center gap-3 text-teal-800">
                    <CheckCircle2 size={28} />

                    <h3 className="text-xl font-extrabold">
                      Complaint Registered Successfully
                    </h3>
                  </div>

                  <div className="mt-5 rounded-xl bg-white p-4">
                    <p className="text-xs font-bold uppercase text-slate-500">
                      Your Ticket ID
                    </p>

                    <p className="mt-2 break-all text-2xl font-extrabold text-blue-900">
                      {registration.ticket_id}
                    </p>

                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(
                            registration.ticket_id
                          );
                          setError("");
                        } catch {
                          setError(
                            "Could not copy the ticket ID. Please copy it manually."
                          );
                        }
                      }}
                      className="mt-3 text-sm font-semibold text-blue-700 underline"
                    >
                      Copy Ticket ID
                    </button>
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-teal-900">
                    <p>
                      <strong>Assigned Department:</strong>{" "}
                      {registration.assigned_department ||
                        "Manual review required"}
                    </p>

                    <p>
                      <strong>Routing:</strong>{" "}
                      {registration.routing_status}
                    </p>

                    <p>
                      <strong>Status:</strong>{" "}
                      {registration.status}
                    </p>
                  </div>

                  <p className="mt-4 text-xs leading-5 text-teal-800">
                    This is a JanSahayak demonstration registration.
                    It has been saved locally and has not been submitted
                    to a government department.
                  </p>
                </div>
              ) : (
                <>
                  {/* IMPORTANT NOTICE */}

                  <div className="mt-5 rounded-xl bg-blue-50 p-4 text-sm leading-6 text-blue-800">
                    <strong>Important:</strong> This is an AI analysis,
                    not a registered complaint. No ticket has been
                    created. AI image checks cannot independently prove
                    when or where a photo was taken.
                  </div>

                  {/* REGISTRATION ERROR */}

                  {error && (
                    <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                      <AlertCircle
                        size={20}
                        className="mt-0.5 shrink-0"
                      />
                      <p>{error}</p>
                    </div>
                  )}

                  {/* REGISTER BUTTON */}

                  {analysis?.needs_clarification ? (
                    <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                      Please edit your complaint and provide the
                      missing information before registration.
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleRegisterComplaint}
                      disabled={registering || !analysis}
                      className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl bg-teal-700 px-6 py-4 font-bold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {registering ? (
                        <>
                          <LoaderCircle
                            size={20}
                            className="animate-spin"
                          />
                          Registering Complaint...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={20} />
                          Confirm & Register Complaint
                        </>
                      )}
                    </button>
                  )}

                  {/* EDIT BUTTON */}

                  <button
                    type="button"
                    onClick={handleEdit}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 py-4 font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <ArrowLeft size={18} />
                    Edit Complaint
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default ReportSection;
