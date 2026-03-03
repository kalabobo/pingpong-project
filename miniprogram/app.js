App({
  onLaunch() {
    wx.cloud.init({
      env: 'cloud1-4geyajtwf901c7d0', // 你现在可见的环境ID
      traceUser: true
    });
  }
});
