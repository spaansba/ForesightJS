import { css } from "lit"

export const buttonStyles = css`
  .btn {
    all: unset;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    height: 20px;
    min-width: 20px;
    padding: 0 5px;
    color: var(--fs-muted);
    white-space: nowrap;
    cursor: pointer;
  }

  .btn:hover,
  .btn.active {
    background-color: var(--fs-hover);
    color: var(--fs-text);
  }

  .btn:focus-visible {
    outline: 1px dashed var(--fs-text);
    outline-offset: -1px;
  }

  .btn:disabled {
    color: var(--fs-dim);
    cursor: default;
    background: none;
  }

  .btn svg {
    width: 13px;
    height: 13px;
  }
`
