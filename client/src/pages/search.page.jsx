import { useParams } from "react-router-dom";

const SearchPage = () => {
  const { searchQuery } = useParams();
  return <div>Displaying search results for {searchQuery}</div>;
};

export default SearchPage;
