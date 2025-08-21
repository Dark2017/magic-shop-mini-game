// H5适配版广告管理器 - 处理激励视频广告和看广告复活功能
export default class AdManager {
  constructor() {
    this.rewardedVideoAd = null
    this.isAdReady = false
    this.rewardCallback = null
    this.dailyAdCount = 0
    this.maxDailyAds = 10 // 每日广告观看上限
    this.isH5Environment = null // 延迟检测环境
    
    // 延迟初始化，确保wx对象已经创建
    setTimeout(() => {
      try {
        this.isH5Environment = this.detectH5Environment()
        this.init()
      } catch (error) {
        console.error('AdManager初始化失败:', error)
        // 设置为H5环境作为默认值
        this.isH5Environment = true
        this.init()
      }
    }, 100)
  }
  
  detectH5Environment() {
    // 检测是否为H5环境 - 检查wx对象是否为模拟对象
    if (typeof window === 'undefined') {
      return false // 非浏览器环境
    }
    
    // 如果没有wx对象，说明是H5环境
    if (!window.wx) {
      return true
    }
    
    // 检查是否为模拟的wx对象（H5GameAdapter创建的）
    // 真实微信环境下，createRewardedVideoAd是原生函数
    // H5环境下是我们创建的模拟函数
    const isSimulatedWx = window.wx.createRewardedVideoAd && 
                         window.wx.createRewardedVideoAd.toString().includes('H5环境下模拟')
    
    return isSimulatedWx || !window.wx.createRewardedVideoAd
  }
  
  init() {
    if (this.isH5Environment) {
      console.log('H5环境 - 使用模拟广告系统')
      this.isAdReady = true // H5环境下广告始终可用
      this.loadDailyAdCount()
      return
    }
    
    // 检查微信版本是否支持广告
    if (!wx.createRewardedVideoAd) {
      console.log('当前微信版本不支持激励视频广告')
      this.isAdReady = false
      return
    }
    
    this.initRewardedVideoAd()
    this.loadDailyAdCount()
  }
  
  setManagers(managers) {
    this.dataManager = managers.dataManager
    this.gameManager = managers.gameManager
    this.uiManager = managers.uiManager
  }
  
  initRewardedVideoAd() {
    this.rewardedVideoAd = wx.createRewardedVideoAd({
      adUnitId: 'adunit-xxxxxxxxxxxxxxxx' // 需要替换为真实的广告位ID
    })
    
    // 广告加载成功
    this.rewardedVideoAd.onLoad(() => {
      console.log('激励视频广告加载成功')
      this.isAdReady = true
    })
    
    // 广告加载失败
    this.rewardedVideoAd.onError((err) => {
      console.error('激励视频广告加载失败:', err)
      this.isAdReady = false
      this.handleAdError(err.errCode)
    })
    
    // 广告关闭事件
    this.rewardedVideoAd.onClose((res) => {
      if (res && res.isEnded || res === undefined) {
        // 用户完整观看了广告
        console.log('用户完整观看广告，发放奖励')
        this.handleAdReward()
        this.incrementDailyAdCount()
      } else {
        // 用户中途退出
        console.log('用户中途退出广告')
        this.handleAdCancel()
      }
      
      // 重新加载下一个广告
      this.loadNextAd()
    })
    
    // 预加载广告
    this.loadNextAd()
  }
  
  loadNextAd() {
    if (this.rewardedVideoAd) {
      this.rewardedVideoAd.load()
    }
  }
  
  // 显示复活广告
  showReviveAd(callback) {
    console.log('尝试显示复活广告')
    
    // 如果环境检测还未完成，等待一下
    if (this.isH5Environment === null) {
      console.log('环境检测中，延迟执行广告显示')
      setTimeout(() => this.showReviveAd(callback), 200)
      return
    }
    
    // 检查每日观看次数限制
    if (this.dailyAdCount >= this.maxDailyAds) {
      this.showDailyLimitReached()
      return
    }
    
    this.rewardCallback = callback
    
    // H5环境下的特殊处理
    if (this.isH5Environment) {
      this.showH5AdDialog('复活', '观看广告可以复活并继续游戏')
      return
    }
    
    if (!this.isAdReady || !this.rewardedVideoAd) {
      console.log('广告未准备好，使用降级方案')
      this.showFallbackOptions()
      return
    }
    
    // 显示广告
    this.rewardedVideoAd.show().catch((err) => {
      console.error('广告显示失败:', err)
      this.showFallbackOptions()
    })
  }
  
  // 显示加速生产广告
  showSpeedUpAd(callback) {
    console.log('显示加速生产广告')
    
    // 如果环境检测还未完成，等待一下
    if (this.isH5Environment === null) {
      console.log('环境检测中，延迟执行广告显示')
      setTimeout(() => this.showSpeedUpAd(callback), 200)
      return
    }
    
    this.rewardCallback = callback
    
    // H5环境下的特殊处理
    if (this.isH5Environment) {
      this.showH5AdDialog('加速生产', '观看广告可以立即完成生产')
      return
    }
    
    if (!this.isAdReady) {
      this.showFallbackOptions()
      return
    }
    
    this.rewardedVideoAd.show().catch(() => {
      this.showFallbackOptions()
    })
  }
  
  // 显示双倍收益广告
  showDoubleRewardAd(callback) {
    console.log('显示双倍收益广告')
    
    // 如果环境检测还未完成，等待一下
    if (this.isH5Environment === null) {
      console.log('环境检测中，延迟执行广告显示')
      setTimeout(() => this.showDoubleRewardAd(callback), 200)
      return
    }
    
    this.rewardCallback = callback
    
    // H5环境下的特殊处理
    if (this.isH5Environment) {
      this.showH5AdDialog('双倍收益', '观看广告可以获得双倍收益')
      return
    }
    
    if (!this.isAdReady) {
      this.showFallbackOptions()
      return
    }
    
    this.rewardedVideoAd.show().catch(() => {
      this.showFallbackOptions()
    })
  }
  
  // H5环境下的广告对话框
  showH5AdDialog(title, description) {
    wx.showModal({
      title: `观看广告 - ${title}`,
      content: `${description}\n\n在H5环境下，我们将模拟广告播放过程。\n点击"观看广告"按钮开始。`,
      confirmText: '观看广告',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.simulateH5Ad()
        } else {
          this.handleAdCancel()
        }
      },
      fail: () => {
        this.handleAdCancel()
      }
    })
  }
  
  // 模拟H5环境下的广告播放
  simulateH5Ad() {
    // 创建一个简单的加载提示
    wx.showToast({
      title: '广告加载中...',
      icon: 'loading',
      duration: 2000,
      mask: true
    })
    
    // 模拟广告播放时间（2-5秒）
    const adDuration = 2000 + Math.random() * 3000
    
    setTimeout(() => {
      // 80%的概率成功观看完成
      const watchedComplete = Math.random() > 0.2
      
      if (watchedComplete) {
        console.log('H5模拟广告观看完成，发放奖励')
        this.handleAdReward()
        this.incrementDailyAdCount()
      } else {
        console.log('H5模拟广告中途退出')
        wx.showToast({
          title: '广告未观看完整',
          icon: 'none',
          duration: 1500
        })
        this.handleAdCancel()
      }
    }, adDuration)
  }
  
  // 处理广告奖励
  handleAdReward() {
    if (this.rewardCallback) {
      this.rewardCallback(true)
      this.rewardCallback = null
    }
    
    // 显示奖励提示
    this.showRewardNotification()
  }
  
  // 处理广告取消
  handleAdCancel() {
    if (this.rewardCallback) {
      this.rewardCallback(false)
      this.rewardCallback = null
    }
  }
  
  // 处理广告错误
  handleAdError(errCode) {
    console.log('广告错误代码:', errCode)
    
    switch(errCode) {
      case 1004: // 无适合的广告
        this.showShareFallback()
        break
      case 1005: // 广告组件审核中
        this.showShareFallback()
        break
      case 1006: // 广告组件被驳回
        this.showShareFallback()
        break
      case 1007: // 广告单元已关闭
        this.showShareFallback()
        break
      default:
        this.showShareFallback()
    }
  }
  
  // 降级方案选择
  showFallbackOptions() {
    wx.showActionSheet({
      itemList: ['分享到群聊获得奖励', '观看其他广告', '取消'],
      success: (res) => {
        switch(res.tapIndex) {
          case 0:
            this.showShareFallback()
            break
          case 1:
            // 可以尝试其他广告位或重新加载
            this.loadNextAd()
            setTimeout(() => {
              if (this.rewardCallback) {
                this.showReviveAd(this.rewardCallback)
              }
            }, 1000)
            break
          case 2:
            this.handleAdCancel()
            break
        }
      },
      fail: () => {
        this.handleAdCancel()
      }
    })
  }
  
  // 分享降级方案
  showShareFallback() {
    wx.showModal({
      title: '获得奖励',
      content: '分享游戏到微信群可获得同样奖励！',
      confirmText: '立即分享',
      cancelText: '放弃奖励',
      success: (res) => {
        if (res.confirm) {
          this.shareGameForReward()
        } else {
          this.handleAdCancel()
        }
      }
    })
  }
  
  // 分享游戏获取奖励
  shareGameForReward() {
    const shareTexts = [
      '魔法商店经营得不错，快来看看我的店铺！',
      '我的魔法商店已经升级了，一起来经营吧！',
      '发现了一个超好玩的魔法商店游戏！',
      '在魔法商店里赚了好多金币，快来挑战我！'
    ]
    
    const randomText = shareTexts[Math.floor(Math.random() * shareTexts.length)]
    
    wx.shareAppMessage({
      title: randomText,
      imageUrl: 'images/share-image.jpg', // 需要准备分享图片
      query: 'from=share&inviter=' + this.getPlayerId(),
      success: () => {
        console.log('分享成功，发放奖励')
        this.handleAdReward()
      },
      fail: () => {
        console.log('分享失败')
        this.handleAdCancel()
      }
    })
  }
  
  // 每日广告次数管理
  loadDailyAdCount() {
    try {
      const today = new Date().toDateString()
      const lastDate = wx.getStorageSync('lastAdDate') || ''
      
      if (lastDate === today) {
        this.dailyAdCount = wx.getStorageSync('dailyAdCount') || 0
      } else {
        this.dailyAdCount = 0
        wx.setStorageSync('lastAdDate', today)
        wx.setStorageSync('dailyAdCount', 0)
      }
    } catch (e) {
      console.error('加载每日广告次数失败:', e)
      this.dailyAdCount = 0
    }
  }
  
  incrementDailyAdCount() {
    this.dailyAdCount++
    try {
      wx.setStorageSync('dailyAdCount', this.dailyAdCount)
    } catch (e) {
      console.error('保存每日广告次数失败:', e)
    }
  }
  
  showDailyLimitReached() {
    wx.showModal({
      title: '今日观看上限',
      content: `今天已观看${this.maxDailyAds}次广告，明天再来吧！\n可以通过分享获得奖励`,
      confirmText: '立即分享',
      cancelText: '知道了',
      success: (res) => {
        if (res.confirm) {
          this.shareGameForReward()
        } else {
          this.handleAdCancel()
        }
      }
    })
  }
  
  showRewardNotification() {
    wx.showToast({
      title: '奖励已发放！',
      icon: 'success',
      duration: 1500
    })
  }
  
  getPlayerId() {
    // 获取玩家ID的简单实现
    return wx.getStorageSync('playerId') || 'player_' + Date.now()
  }
  
  // 获取广告状态
  getAdStatus() {
    return {
      isReady: this.isAdReady,
      dailyCount: this.dailyAdCount,
      remainingAds: Math.max(0, this.maxDailyAds - this.dailyAdCount)
    }
  }
}
