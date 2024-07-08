import { Link } from "react-router-dom";
import { getFullDay } from "../common/date";

const AboutUser = ({ bio, joinedAt, socialLinks, className }) => {
  return (
    <div className={`md:w-[90%] md:mt-7 ${className}`}>
      <p className="text-xl leading-7">
        {bio.length ? bio : "Nothing to read here"}
      </p>

      <div className="flex gap-x-7 gap-y-2 flex-wrap my-7 items-center text-dark-grey">
        {Object.keys(socialLinks).map((socialLink, index) => {
          const link = socialLinks[socialLink];

          return link ? (
            <Link
              to={link}
              key={socialLink}
              target="_blank"
              className="flex justify-center gap-2"
            >
              <i
                className={`${
                  socialLink !== "website"
                    ? `fi-brands-${socialLink}`
                    : "fi-rr-globe"
                } text-2xl hover:text-black`}
              ></i>
            </Link>
          ) : (
            ""
          );
        })}
      </div>

      <p className="text-xl leading-7 text-dark-grey">
        Joined on {getFullDay(joinedAt)}
      </p>
    </div>
  );
};

export default AboutUser;
