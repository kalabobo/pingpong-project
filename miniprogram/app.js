App({
  onLaunch() {
    wx.cloud.init({
      env: 'cloud1-4geyajtwf901c7d0', // 改成你的云开发环境ID
      traceUser: true
    });
  }
});
