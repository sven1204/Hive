import classes from "./FloatingField.module.css";

export default function FloatingField({ id, name, type = "text", label, value, onChange, autoComplete, error = false, children }) {
  return (
    <div className={`${classes.field} ${error ? classes.fieldError : ""}`}>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        placeholder=" "
        className={classes.input}
      />
      <label htmlFor={id} className={classes.label}>{label}</label>
      {children && <span className={classes.fieldAction}>{children}</span>}
    </div>
  );
}
