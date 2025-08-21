// 数据管理器 - 处理游戏数据存储、加载和验证
export default class DataManager {
  constructor() {
    this.gameData = {
      // 玩家基础信息
      playerId: '',
      playerName: '魔法商人',
      level: 1,
      exp: 0,
      expToNext: 100,
      
      // 货币系统
      gold: 100,           // 金币
      gems: 5,             // 宝石(付费货币)
      magicPowder: 0,      // 魔法粉末(特殊货币)
      
      // 商店相关
      shopLevel: 1,
      shopExp: 0,
      reputation: 0,       // 声望值
      
      // 生产设施
      workshops: [
        {
          id: 'potion_lab',
          name: '药水实验室',
          level: 1,
          unlocked: true,
          producing: false,
          productionStartTime: 0,
          productionDuration: 30000, // 30秒
          baseIncome: 10,
          upgradeGoldCost: 50,
          upgradeGemCost: 0
        },
        {
          id: 'enchant_table',
          name: '附魔台',
          level: 0,
          unlocked: false,
          producing: false,
          productionStartTime: 0,
          productionDuration: 60000, // 60秒
          baseIncome: 25,
          upgradeGoldCost: 200,
          upgradeGemCost: 1
        },
        {
          id: 'crystal_forge',
          name: '水晶熔炉',
          level: 0,
          unlocked: false,
          producing: false,
          productionStartTime: 0,
          productionDuration: 120000, // 2分钟
          baseIncome: 50,
          upgradeGoldCost: 500,
          upgradeGemCost: 2
        }
      ],
      
      // 商品库存
      inventory: {
        potions: 0,
        enchantments: 0,
        crystals: 0,
        rareItems: 0
      },
      
      // 顾客系统
      customers: [],
      customerSatisfaction: 1.0,
      customerHappiness: 1.0,
      productionEfficiency: 1.0,
      
      // 成就系统
      achievements: {
        firstSale: false,
        goldMaster: false,
        workshopMaster: false,
        customerFavorite: false
      },
      
      // 离线收益
      offlineTime: 0,
      lastActiveTime: Date.now(),
      
      // 游戏统计
      stats: {
        totalGoldEarned: 0,
        totalItemsSold: 0,
        totalCustomersServed: 0,
        totalAdsWatched: 0,
        totalGameTime: 0,
        gamesPlayed: 0
      },
      
      // 设置
      settings: {
        soundEnabled: true,
        musicEnabled: true,
        notificationsEnabled: true,
        autoSellEnabled: false
      },
      
      // 版本信息
      version: '1.0.0',
      saveTime: Date.now()
    }
    
    this.isDirty = false // 数据是否需要保存
    this.autoSaveInterval = 30000 // 30秒自动保存
    this.startAutoSave()
  }
  
  // 设置其他管理器的引用
  setManagers(managers) {
    this.gameManager = managers.gameManager
  }
  
  // 初始化玩家ID
  initPlayerId() {
    if (!this.gameData.playerId) {
      this.gameData.playerId = 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
      this.markDirty()
    }
  }
  
  // 加载游戏数据
  loadData() {
    try {
      const savedData = wx.getStorageSync('magicShopGameData')
      if (savedData) {
        // 合并保存的数据和默认数据
        this.gameData = this.mergeData(this.gameData, savedData)
        console.log('游戏数据加载成功')
        
        // 检查数据版本兼容性
        this.migrateData()
      } else {
        console.log('没有找到保存的数据，使用默认数据')
      }
      
      this.initPlayerId()
      this.updateOfflineTime()
      
    } catch (error) {
      console.error('加载游戏数据失败:', error)
      this.initPlayerId()
    }
  }
  
  // 保存游戏数据
  saveData() {
    try {
      this.gameData.saveTime = Date.now()
      this.gameData.lastActiveTime = Date.now()
      
      wx.setStorageSync('magicShopGameData', this.gameData)
      this.isDirty = false
      console.log('游戏数据保存成功')
      
      // 定期保存到云端(防作弊)
      this.saveToCloud()
      
    } catch (error) {
      console.error('保存游戏数据失败:', error)
    }
  }
  
  // 云端保存(关键数据验证)
  saveToCloud() {
    if (!wx.setUserCloudStorage) return
    
    const criticalData = {
      level: this.gameData.level,
      gold: this.gameData.gold,
      gems: this.gameData.gems,
      shopLevel: this.gameData.shopLevel,
      totalGoldEarned: this.gameData.stats.totalGoldEarned,
      saveTime: this.gameData.saveTime
    }
    
    try {
      wx.setUserCloudStorage({
        KVDataList: [{
          key: 'criticalData',
          value: JSON.stringify(criticalData)
        }],
        success: () => {
          console.log('关键数据云端保存成功')
        },
        fail: (err) => {
          console.error('云端保存失败:', err)
        }
      })
    } catch (error) {
      console.error('云端保存异常:', error)
    }
  }
  
  // 数据合并
  mergeData(defaultData, savedData) {
    const merged = JSON.parse(JSON.stringify(defaultData))
    
    for (const key in savedData) {
      if (typeof defaultData[key] === 'object' && defaultData[key] !== null) {
        if (Array.isArray(defaultData[key])) {
          merged[key] = savedData[key] || defaultData[key]
        } else {
          merged[key] = this.mergeData(defaultData[key], savedData[key] || {})
        }
      } else {
        merged[key] = savedData[key] !== undefined ? savedData[key] : defaultData[key]
      }
    }
    
    return merged
  }
  
  // 数据迁移(版本兼容)
  migrateData() {
    const currentVersion = '1.0.0'
    if (this.gameData.version !== currentVersion) {
      console.log(`数据版本从 ${this.gameData.version} 迁移到 ${currentVersion}`)
      
      // 在这里添加版本迁移逻辑
      // 例如：添加新字段、转换旧数据格式等
      
      this.gameData.version = currentVersion
      this.markDirty()
    }
  }
  
  // 更新离线时间
  updateOfflineTime() {
    const currentTime = Date.now()
    const lastActiveTime = this.gameData.lastActiveTime || currentTime
    this.gameData.offlineTime = Math.max(0, currentTime - lastActiveTime)
    this.gameData.lastActiveTime = currentTime
  }
  
  // 标记数据需要保存
  markDirty() {
    this.isDirty = true
  }
  
  // 自动保存
  startAutoSave() {
    setInterval(() => {
      if (this.isDirty) {
        this.saveData()
      }
    }, this.autoSaveInterval)
  }
  
  // 获取数据的方法
  getGold() {
    return this.gameData.gold
  }
  
  getGems() {
    return this.gameData.gems
  }
  
  getLevel() {
    return this.gameData.level
  }
  
  getShopLevel() {
    return this.gameData.shopLevel
  }
  
  getWorkshops() {
    return this.gameData.workshops
  }
  
  getInventory() {
    return this.gameData.inventory
  }
  
  getStats() {
    return this.gameData.stats
  }
  
  // 修改数据的方法
  addGold(amount) {
    if (amount > 0) {
      this.gameData.gold += amount
      this.gameData.stats.totalGoldEarned += amount
      this.markDirty()
      this.checkAchievements()
      return true
    }
    return false
  }
  
  spendGold(amount) {
    if (amount > 0 && this.gameData.gold >= amount) {
      this.gameData.gold -= amount
      this.markDirty()
      return true
    }
    return false
  }
  
  addGems(amount) {
    if (amount > 0) {
      this.gameData.gems += amount
      this.markDirty()
      return true
    }
    return false
  }
  
  spendGems(amount) {
    if (amount > 0 && this.gameData.gems >= amount) {
      this.gameData.gems -= amount
      this.markDirty()
      return true
    }
    return false
  }
  
  addExp(amount) {
    this.gameData.exp += amount
    
    // 检查升级
    while (this.gameData.exp >= this.gameData.expToNext) {
      this.levelUp()
    }
    
    this.markDirty()
  }
  
  levelUp() {
    this.gameData.exp -= this.gameData.expToNext
    this.gameData.level++
    this.gameData.expToNext = Math.floor(this.gameData.expToNext * 1.2)
    
    // 升级奖励
    const goldReward = this.gameData.level * 50
    const gemReward = Math.floor(this.gameData.level / 5)
    
    this.addGold(goldReward)
    if (gemReward > 0) {
      this.addGems(gemReward)
    }
    
    // 解锁新内容
    this.checkUnlocks()
    
    console.log(`玩家升级到 ${this.gameData.level} 级！`)
  }
  
  // 检查解锁内容
  checkUnlocks() {
    this.gameData.workshops.forEach(workshop => {
      if (!workshop.unlocked) {
        const requiredLevel = this.getRequiredLevel(workshop.id)
        if (this.gameData.level >= requiredLevel) {
          workshop.unlocked = true
          console.log(`解锁新设施: ${workshop.name}`)
        }
      }
    })
  }
  
  getRequiredLevel(workshopId) {
    const requirements = {
      'potion_lab': 1,
      'enchant_table': 3,
      'crystal_forge': 8
    }
    return requirements[workshopId] || 1
  }
  
  // 成就检查
  checkAchievements() {
    const achievements = this.gameData.achievements
    
    if (!achievements.firstSale && this.gameData.stats.totalItemsSold > 0) {
      achievements.firstSale = true
      this.showAchievement('首次销售', '恭喜完成第一笔交易！')
    }
    
    if (!achievements.goldMaster && this.gameData.stats.totalGoldEarned >= 10000) {
      achievements.goldMaster = true
      this.showAchievement('黄金大师', '累计赚取10000金币！')
    }
    
    if (!achievements.workshopMaster && this.gameData.workshops.filter(w => w.level >= 5).length >= 2) {
      achievements.workshopMaster = true
      this.showAchievement('设施大师', '拥有2个5级以上的设施！')
    }
  }
  
  showAchievement(title, description) {
    // 检查微信API是否可用
    if (typeof wx !== 'undefined' && wx.showToast) {
      wx.showToast({
        title: `🏆 ${title}`,
        icon: 'none',
        duration: 2000
      })
    } else {
      // fallback: 使用浏览器alert
      console.log(`获得成就: ${title} - ${description}`)
      alert(`🏆 ${title}\n${description}`)
    }
    
    // 成就奖励
    this.addGems(1)
  }
  
  // 统计更新
  updateStats(statName, value = 1) {
    if (this.gameData.stats[statName] !== undefined) {
      this.gameData.stats[statName] += value
      this.markDirty()
    }
  }
  
  // 重置游戏数据
  resetGameData() {
    // 检查微信API是否可用
    if (typeof wx !== 'undefined' && wx.showModal) {
      wx.showModal({
        title: '重置游戏',
        content: '确定要重置所有游戏数据吗？此操作不可恢复！',
        success: (res) => {
          if (res.confirm) {
            try {
              wx.removeStorageSync('magicShopGameData')
              console.log('游戏数据已重置')
              
              // 重新初始化
              this.constructor()
              this.initPlayerId()
              
            } catch (error) {
              console.error('重置数据失败:', error)
            }
          }
        }
      })
    } else {
      // fallback: 使用浏览器confirm
      const confirmed = confirm('确定要重置所有游戏数据吗？此操作不可恢复！')
      if (confirmed) {
        try {
          localStorage.removeItem('magicShopGameData')
          console.log('游戏数据已重置')
          
          // 重新初始化
          this.constructor()
          this.initPlayerId()
          
        } catch (error) {
          console.error('重置数据失败:', error)
        }
      }
    }
  }
  
  // 获取游戏进度百分比
  getGameProgress() {
    let progress = 0
    
    // 等级进度 (30%)
    progress += Math.min(this.gameData.level / 20, 1) * 30
    
    // 设施解锁进度 (25%)
    const unlockedWorkshops = this.gameData.workshops.filter(w => w.unlocked).length
    progress += (unlockedWorkshops / this.gameData.workshops.length) * 25
    
    // 成就完成进度 (25%)
    const completedAchievements = Object.values(this.gameData.achievements).filter(a => a).length
    progress += (completedAchievements / Object.keys(this.gameData.achievements).length) * 25
    
    // 金币累计进度 (20%)
    progress += Math.min(this.gameData.stats.totalGoldEarned / 100000, 1) * 20
    
    return Math.floor(progress)
  }
}
