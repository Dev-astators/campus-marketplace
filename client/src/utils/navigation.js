export const redirectTo = (href) => {
  if (typeof window === "undefined") return;

  window.location.assign(href);
};
