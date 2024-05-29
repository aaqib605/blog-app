import axios from "axios";

export const uploadImage = async (img) => {
  let imgURL;

  try {
    const {
      data: { uploadImageURL },
    } = await axios.get(
      `${import.meta.env.VITE_SERVER_DOMAIN}/get-upload-image-url`
    );

    await axios({
      method: "PUT",
      url: uploadImageURL,
      headers: { "Content-Type": "multipart/form-data" },
      data: img,
    });

    imgURL = uploadImageURL.split("?")[0];
  } catch (error) {
    console.error("Error uploading image:", error);
    res.status(500).json({ error });
  }

  return imgURL;
};
