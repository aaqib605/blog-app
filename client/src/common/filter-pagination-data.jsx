import axios from "axios";

export const filterPaginationData = async ({
  createNewArr = false,
  existingBlogs,
  newFetchedBlogs,
  page,
  countRoute,
  dataToSend = {},
}) => {
  let obj;

  try {
    if (existingBlogs !== null && !createNewArr) {
      obj = {
        ...existingBlogs,
        results: [...existingBlogs.results, ...newFetchedBlogs],
        page,
      };
    } else {
      const {
        data: { totalDocs },
      } = await axios.post(
        `${import.meta.env.VITE_SERVER_DOMAIN}/${countRoute}`,
        dataToSend
      );

      obj = { results: newFetchedBlogs, page: 1, totalDocs };
    }

    return obj;
  } catch (error) {
    console.log(err);
  }
};

export default filterPaginationData;
