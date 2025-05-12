import React, { useState, useRef } from "react"
import styles from "./packagemanager.module.css"
export function InstallCodeBlock({ code }) {
  const [copied, setCopied] = useState(false)
  const codeRef = useRef(null)

  const copyToClipboard = () => {
    if (codeRef.current) {
      navigator.clipboard.writeText(code).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
    }
  }

  // SVG clipboard icon
  const ClipboardIcon = () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
    </svg>
  )

  // Checkmark icon for copied state
  const CheckIcon = () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  )

  return (
    <div className={styles.installCodeBlock}>
      <pre className={styles.codeBlock} ref={codeRef}>
        <code>{code}</code>
        <button
          className={styles.copyButton}
          onClick={copyToClipboard}
          aria-label="Copy to clipboard"
        >
          {copied ? <CheckIcon /> : <ClipboardIcon />}
        </button>
      </pre>
    </div>
  )
}
