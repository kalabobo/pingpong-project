const db = wx.cloud.database();

const ERROR_LIBRARY = {
  技术动作质量: [
    '正手起下旋：拍面过立、摩擦不足导致下网',
    '反手拧拉上旋：引拍过大、击球点靠后导致出界',
    '反手被上旋顶住：重心后仰、借力不足导致回球浅高'
  ],
  发球与接发球: ['发球下旋不转：触球薄厚不稳，被对手直接抢冲', '接发急长上旋：判断旋转滞后，反手封挡出界'],
  战术决策: ['领先时强行一板致命：风险收益比失衡', '关键分保守搓摆：主动权丢失导致被先上手'],
  身体与时机: ['启动慢半拍：对来球长度判断延迟，击球点过晚', '重心转移不完整：手先于脚，导致控球质量下降']
};

Page({
  data: {
    matchDate: new Date().toISOString().slice(0, 10),
    categoryList: Object.keys(ERROR_LIBRARY),
    categoryIndex: 0,
    detailList: ERROR_LIBRARY[Object.keys(ERROR_LIBRARY)[0]],
    detailIndex: 0,
    phaseList: ['发球轮', '接发球轮', '相持前3板', '中远台相持'],
    phaseIndex: 0,
    note: '',
    stats: { total: 0, topCategory: { name: '暂无', count: 0 }, topDetail: { name: '暂无', count: 0 } }
  },

  onShow() {
    this.loadStats();
  },

  onDateChange(e) { this.setData({ matchDate: e.detail.value }); },
  onCategoryChange(e) {
    const categoryIndex = Number(e.detail.value);
    const category = this.data.categoryList[categoryIndex];
    this.setData({ categoryIndex, detailList: ERROR_LIBRARY[category], detailIndex: 0 });
  },
  onDetailChange(e) { this.setData({ detailIndex: Number(e.detail.value) }); },
  onPhaseChange(e) { this.setData({ phaseIndex: Number(e.detail.value) }); },
  onNoteInput(e) { this.setData({ note: e.detail.value }); },

  submitRecord() {
  const payload = {
    matchTime: `${this.data.matchDate}T12:00`,
    category: this.data.categoryList[this.data.categoryIndex],
    detail: this.data.detailList[this.data.detailIndex],
    phase: this.data.phaseList[this.data.phaseIndex],
    note: this.data.note,
    createdAt: new Date()
  };

  db.collection('records').add({
    data: payload,
    success: () => {
      wx.showToast({ title: '已保存' });
      this.setData({ note: '' });
      this.loadStats();
    },
    fail: () => wx.showToast({ title: '保存失败', icon: 'none' })
  });
},


    wx.request({
      url: `${API_BASE}/api/records`,
      method: 'POST',
      data: payload,
      success: () => {
        wx.showToast({ title: '已保存' });
        this.setData({ note: '' });
        this.loadStats();
      },
      fail: () => wx.showToast({ title: '保存失败', icon: 'none' })
    });
  },

  loadStats() {
  db.collection('records').get({
    success: (res) => {
      const list = res.data || [];
      const total = list.length;

      const byCategory = {};
      const byDetail = {};

      list.forEach((item) => {
        byCategory[item.category] = (byCategory[item.category] || 0) + 1;
        byDetail[item.detail] = (byDetail[item.detail] || 0) + 1;
      });

      const maxEntry = (obj) => {
        const entries = Object.entries(obj);
        if (!entries.length) return ['暂无', 0];
        entries.sort((a, b) => b[1] - a[1]);
        return entries[0];
      };

      const topCategory = maxEntry(byCategory);
      const topDetail = maxEntry(byDetail);

      this.setData({
        stats: {
          total,
          topCategory: { name: topCategory[0], count: topCategory[1] },
          topDetail: { name: topDetail[0], count: topDetail[1] }
        }
      });
    },
    fail: () => {
      wx.showToast({ title: '读取统计失败', icon: 'none' });
    }
  });
}

});
