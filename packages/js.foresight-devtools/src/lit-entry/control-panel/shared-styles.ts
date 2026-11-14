import { css } from "lit"

export const iconButtonStyles = css`
  .icon-button {
    all: unset;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 3px;
    height: 22px;
    min-width: 22px;
    padding: 0 4px;
    border-radius: 4px;
    color: var(--fs-muted);
    cursor: pointer;
    transition:
      background-color 0.12s ease,
      color 0.12s ease;
  }

  .icon-button:hover,
  .icon-button.active {
    background-color: var(--fs-hover);
    color: var(--fs-text);
  }

  .icon-button:focus-visible {
    outline: 1px solid var(--fs-accent);
  }

  .icon-button:disabled {
    opacity: 0.35;
    cursor: default;
    background: none;
    color: var(--fs-muted);
  }

  .icon-button svg {
    width: 14px;
    height: 14px;
  }
`
