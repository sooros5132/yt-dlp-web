export function isMobile() {
  if (/(Android|webOS|iPhone|iPad|iPod|BlackBerry|Windows Phone)/i.test(navigator.userAgent)) {
    return true;
  } else {
    return false;
  }
}
