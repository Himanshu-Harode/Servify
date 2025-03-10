// utils.js
export const formatTimestamp = (timestamp) => {
    if (!timestamp) return "N/A";
    if (typeof timestamp.toDate === "function") {
      const date = timestamp.toDate();
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return "N/A";
  };
  