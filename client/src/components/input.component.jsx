import { useState } from "react";

const InputBox = ({
  name,
  type,
  id,
  value,
  placeholder,
  icon,
  disable = false,
}) => {
  const [passwordVisible, setPasswordVisible] = useState(false);

  return (
    <div className="relative w-[100%] mb-4">
      <input
        name={name}
        disabled={disable}
        type={
          type === "password" ? (passwordVisible ? "text" : "password") : type
        }
        placeholder={placeholder}
        defaultValue={value}
        id={id}
        className="input-box placeholder:text-dark-grey"
      />

      <i className={`fi ${icon} input-icon text-dark-grey`}></i>

      {type === "password" ? (
        <i
          className={`fi ${
            passwordVisible ? "fi-rr-eye" : "fi-rr-eye-crossed"
          } input-icon left-auto right-4 cursor-pointer`}
          onClick={() => setPasswordVisible((prevState) => !prevState)}
        ></i>
      ) : (
        ""
      )}
    </div>
  );
};

export default InputBox;
