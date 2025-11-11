import { useEffect } from "react";
import "./ContactForm.css";

/**
 * ContactForm Component
 * 
 * Embeds a HubSpot form with custom styling using pure CSS (no Tailwind).
 * The form is styled using standard CSS selectors targeting HubSpot form elements.
 * CSS variables are also defined in :root for HubSpot to use if supported.
 * 
 * @component
 */
const ContactForm = () => {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://js.hsforms.net/forms/embed/41887469.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return (
    <div className="contact-form-wrapper">
      <div className="hs-form-frame" data-region="na1" data-form-id="14cc67c8-a0b1-4173-8173-55d54b364772" data-portal-id="41887469"></div>
    </div>
  );
};

export default ContactForm;
