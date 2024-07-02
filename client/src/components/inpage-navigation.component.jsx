import { useEffect, useRef, useState } from "react";

const InPageNavigation = ({
  children,
  routes,
  defaultHidden = ["trending blogs"],
  defaultActiveTabIndex = 0,
}) => {
  const [inPageNavIndex, setInPageNavIndex] = useState(defaultActiveTabIndex);
  const activeTabRef = useRef();
  const buttonRef = useRef();

  const changeInPageNav = (btn, index) => {
    const { offsetWidth, offsetLeft } = btn;

    activeTabRef.current.style.width = `${offsetWidth}px`;
    activeTabRef.current.style.left = `${offsetLeft}px`;

    setInPageNavIndex(index);
  };

  useEffect(() => {
    changeInPageNav(buttonRef.current, defaultActiveTabIndex);
  }, []);

  return (
    <>
      <div className="relative mb-8 bg-white border-b border-grey flex flex-nowrap overflow-x-auto">
        {routes.map((route, index) => {
          return (
            <button
              ref={index === defaultActiveTabIndex ? buttonRef : null}
              key={index}
              className={`p-4 px-5 capitalize ${
                inPageNavIndex === index ? "text-black" : "text-dark-grey"
              } ${defaultHidden.includes(route) ? "md:hidden" : ""}`}
              onClick={(e) => changeInPageNav(e.target, index)}
            >
              {route}
            </button>
          );
        })}

        <hr ref={activeTabRef} className="absolute bottom-0 duration-300" />
      </div>

      {Array.isArray(children) ? children[inPageNavIndex] : children}
    </>
  );
};

export default InPageNavigation;
