// src/pages/Recognize.jsx
// "Find My Photos" — take a photo OR upload to find your identity
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { recognizeFace } from "../lib/api";
import { Spinner } from "../components";

const STATES = {
  IDLE:    "idle",      // landing — show two options
  CAMERA:  "camera",   // live webcam preview
  LOADING: "loading",  // processing image
  RESULT:  "result",   // match result
  ERROR:   "error",    // API or camera error
};

export default function Recognize() {
  const [state,      setState]      = useState(STATES.IDLE);
  const [preview,    setPreview]    = useState(null);
  const [result,     setResult]     = useState(null);
  const [error,      setError]      = useState(null);
  const [camError,   setCamError]   = useState(null);
  const [selected,   setSelected]   = useState(null);
  const [facingMode, setFacingMode] = useState("user"); // "user"=front "environment"=rear

  const videoRef     = useRef(null);
  const streamRef    = useRef(null);
  const fileInputRef = useRef(null);
  const navigate     = useNavigate();

  // Stop camera when leaving camera state
  useEffect(() => {
    if (state !== STATES.CAMERA) stopCamera();
  }, [state]);

  // Cleanup on unmount
  useEffect(() => () => stopCamera(), []);

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }

  // ----------------------------------------------------------
  // Start camera
  // ----------------------------------------------------------
  async function startCamera(facing = "user") {
    setCamError(null);
    setState(STATES.CAMERA);
    setFacingMode(facing);

    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 100);
    } catch (e) {
      stopCamera();
      setState(STATES.IDLE);
      if (e.name === "NotAllowedError") {
        setCamError("Camera permission denied. Please allow access in your browser settings.");
      } else if (e.name === "NotFoundError") {
        setCamError("No camera found on this device.");
      } else {
        setCamError(`Could not start camera: ${e.message}`);
      }
    }
  }

  function flipCamera() {
    const next = facingMode === "user" ? "environment" : "user";
    startCamera(next);
  }

  // ----------------------------------------------------------
  // Capture frame from video
  // ----------------------------------------------------------
  function captureFrame() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    canvas.toBlob(blob => {
      setPreview(URL.createObjectURL(blob));
      stopCamera();
      submitImage(blob);
    }, "image/jpeg", 0.92);
  }

  // ----------------------------------------------------------
  // File upload
  // ----------------------------------------------------------
  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    submitImage(file);
  }

  // ----------------------------------------------------------
  // Submit to API
  // ----------------------------------------------------------
  function submitImage(fileOrBlob) {
    setState(STATES.LOADING);
    setResult(null);
    setError(null);
    const file = fileOrBlob instanceof File
      ? fileOrBlob
      : new File([fileOrBlob], "capture.jpg", { type: "image/jpeg" });

    recognizeFace(file)
      .then(data  => { setResult(data);    setState(STATES.RESULT); })
      .catch(err  => { setError(err.message); setState(STATES.ERROR); });
  }

  function reset() {
    setState(STATES.IDLE);
    setPreview(null);
    setResult(null);
    setError(null);
    setCamError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // ----------------------------------------------------------
  // Render
  // ----------------------------------------------------------
  return (
    <div className="page">
      <div className="page-header">
        <h1>Find My Photos</h1>
        <p className="page-subtitle">
          Take a photo or upload one to find yourself across all events
        </p>
      </div>

      {/* IDLE — two options */}
      {state === STATES.IDLE && (
        <div className="recognize-options">
          {camError && <div className="cam-error-banner">⚠ {camError}</div>}

          <button className="recognize-option-btn primary" onClick={() => startCamera("user")}>
            <span className="option-icon">📷</span>
            <span className="option-label">Take a photo</span>
            <span className="option-hint">Use your camera</span>
          </button>

          <div className="recognize-divider">or</div>

          <button className="recognize-option-btn secondary" onClick={() => fileInputRef.current?.click()}>
            <span className="option-icon">🖼️</span>
            <span className="option-label">Upload a photo</span>
            <span className="option-hint">Choose from your device</span>
          </button>

          <input ref={fileInputRef} type="file" accept="image/*"
            style={{ display: "none" }} onChange={handleFileChange} />

          <p className="recognize-tip">
            💡 Works best with a clear, front-facing photo — one face only
          </p>
        </div>
      )}

      {/* CAMERA — live preview */}
      {state === STATES.CAMERA && (
        <div className="camera-container">
          <div className="camera-viewport">
            <video ref={videoRef} autoPlay playsInline muted className="camera-video" />
            <div className="camera-overlay">
              <div className="face-guide" />
            </div>
            <p className="camera-hint">Position your face in the circle</p>
          </div>
          <div className="camera-controls">
            <button className="cam-btn cam-btn-cancel" onClick={reset}>✕ Cancel</button>
            <button className="cam-btn cam-btn-capture" onClick={captureFrame}>
              <span className="capture-ring" />
            </button>
            <button className="cam-btn cam-btn-flip" onClick={flipCamera} title="Flip camera">🔄</button>
          </div>
        </div>
      )}

      {/* LOADING */}
      {state === STATES.LOADING && (
        <div className="recognize-loading">
          {preview && <img src={preview} className="preview-img" alt="Captured" />}
          <Spinner text="Searching for your face..." />
        </div>
      )}

      {/* ERROR */}
      {state === STATES.ERROR && (
        <div className="recognize-result">
          {preview && <img src={preview} className="preview-img" alt="Captured" />}
          <div className="result-card result-error">
            <div className="result-icon">😕</div>
            <h2>Couldn't find a match</h2>
            <p>{error}</p>
            <div className="result-actions">
              <button className="btn-primary" onClick={() => startCamera("user")}>Try camera again</button>
              <button className="btn-secondary" onClick={reset}>Upload instead</button>
            </div>
          </div>
        </div>
      )}

      {/* RESULT */}
      {state === STATES.RESULT && result && (
        <div className="recognize-result">
          {preview && <img src={preview} className="preview-img" alt="Captured" />}

          {result.matched ? (
            <div className="result-card result-success">
              <div className="result-icon">🎉</div>
              <h2>Found you!</h2>
              <p className="result-name">{result.person_name}</p>
              <p className="result-meta">
                {result.confidence}% confidence · {result.total_photos} photos
                across {result.events?.length} event{result.events?.length !== 1 ? "s" : ""}
              </p>
              <button className="btn-primary" onClick={() => navigate(`/persons/${result.person_id}`)}>
                View all my photos →
              </button>
              <div className="result-events">
                {result.events?.map(event => (
                  <div key={event.event_id} className="result-event">
                    <div className="result-event-name">{event.event_name} · {event.photos.length} photos</div>
                    <div className="result-event-thumbs">
                      {event.photos.slice(0, 6).map((photo, i) => (
                        <img key={i} src={photo.thumbnail_url} alt=""
                          className="result-thumb" onClick={() => setSelected(photo)} />
                      ))}
                      {event.photos.length > 6 && (
                        <div className="result-thumb result-thumb-more">+{event.photos.length - 6}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <button className="btn-secondary" onClick={reset}>Search again</button>
            </div>
          ) : (
            <div className="result-card result-notfound">
              <div className="result-icon">🔍</div>
              <h2>Not found</h2>
              <p>{result.message}</p>
              <div className="result-actions">
                <button className="btn-primary" onClick={() => startCamera("user")}>Try again</button>
                <button className="btn-secondary" onClick={reset}>Upload instead</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* LIGHTBOX */}
      {selected && (
        <div className="lightbox" onClick={() => setSelected(null)}>
          <div className="lightbox-inner" onClick={e => e.stopPropagation()}>
            <img src={selected.image_url} alt="" />
            <button className="lightbox-close" onClick={() => setSelected(null)}>✕</button>
          </div>
        </div>
      )}
    </div>
  );
}
