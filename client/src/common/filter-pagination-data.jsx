import axios from "axios";

export const filterPaginationData = async ({
  createNewArr = false,
  existingBlogs,
  newFetchedBlogs,
  page,
  countRoute,
  dataToSend = {},
  user = undefined,
}) => {
  let obj;

  const headers = {};

  if (user) {
    headers.headers = {
      Authorization: `Bearer ${user}`,
    };
  }

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
        dataToSend,
        headers
      );

      obj = { results: newFetchedBlogs, page: 1, totalDocs };
    }

    return obj;
  } catch (error) {
    console.log(error);
  }
};

export default filterPaginationData;
