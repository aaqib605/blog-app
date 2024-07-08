import { useParams } from "react-router-dom";

const ProfilePage = () => {
  const { id: profileId } = useParams();

  return <div>ProfilePage</div>;
};

export default ProfilePage;
