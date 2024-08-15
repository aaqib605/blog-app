import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { UserContext } from "../App";
import filterPaginationData from "../common/filter-pagination-data";
import Loader from "../components/loader.component";
import AnimationWrapper from "../common/page-animation";
import NoDataMessage from "../components/nodata.component";
import NotificationCard from "../components/notification-card.component";
import LoadMoreBlogsBtn from "../components/load-more.component";

const Notifications = () => {
  const {
    userAuth,
    userAuth: { jwtToken, newNotificationAvailable },
    setUserAuth,
  } = useContext(UserContext);

  const [filter, setFilter] = useState("all");
  const [notifications, setNotifications] = useState(null);

  const filters = ["all", "like", "comment", "reply"];

  const fetchNotifications = async ({ page, deletedDocCount = 0 }) => {
    try {
      const {
        data: { notifications: data },
      } = await axios.post(
        `${import.meta.env.VITE_SERVER_DOMAIN}/notifications`,
        { page, filter, deletedDocCount },
        {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
        }
      );

      if (newNotificationAvailable) {
        setUserAuth({ ...userAuth, newNotificationAvailable: false });
      }

      const formattedData = await filterPaginationData({
        existingBlogs: notifications,
        newFetchedBlogs: data,
        page,
        countRoute: "all-notifications-count",
        dataToSend: { filter },
        user: jwtToken,
      });

      setNotifications(formattedData);
    } catch (error) {
      console.log(error);
    }
  };

  const handleFilter = (e) => {
    const btn = e.target;

    setFilter(btn.innerHTML);
    setNotifications(null);
  };

  useEffect(() => {
    if (jwtToken) {
      fetchNotifications({ page: 1 });
    }
  }, [filter, jwtToken]);

  return (
    <div>
      <h1 className="max-md:hidden">Recent Notifications</h1>

      <div className="my-8 flex gap-6">
        {filters.map((filterName, index) => {
          return (
            <button
              key={index}
              className={`py-2 ${
                filter === filterName ? "btn-dark" : "btn-light"
              }`}
              onClick={handleFilter}
            >
              {filterName}
            </button>
          );
        })}
      </div>

      {notifications === null ? (
        <Loader />
      ) : (
        <>
          {notifications.results.length ? (
            notifications.results.map((notification, index) => {
              return (
                <AnimationWrapper
                  key={index}
                  transition={{ delay: index * 0.08 }}
                >
                  <NotificationCard
                    data={notification}
                    index={index}
                    notificationState={{ notifications, setNotifications }}
                  />
                </AnimationWrapper>
              );
            })
          ) : (
            <NoDataMessage message="No notifications available." />
          )}

          <LoadMoreBlogsBtn
            state={notifications}
            fetchDataFunction={fetchNotifications}
            additionalParam={{ deletedDocCount: notifications.deletedDocCount }}
          />
        </>
      )}
    </div>
  );
};

export default Notifications;
