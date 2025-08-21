// 游戏管理器 - 核心游戏逻辑，实现让用户上头的机制
export default class GameManager {
  constructor(ctx, canvas) {
    this.ctx = ctx
    this.canvas = canvas
    this.dataManager = null
    this.adManager = null
    this.uiManager = null
    this.questManager = null
    
    // 游戏状态
    this.gameState = 'playing' // playing, paused, gameOver
    this.lastUpdateTime = Date.now()
    
    // 生产系统
    this.productionTimer = 0
    this.autoCollectEnabled = false
    
    // 顾客系统
    this.customers = []
    this.customerSpawnTimer = 0
    this.customerSpawnInterval = 5000 // 5秒生成一个顾客
    
    // 离线收益系统
    this.offlineRewards = null
    
    // 视觉效果
    this.particles = []
    this.floatingTexts = []
    
    // 触摸处理
    this.lastTouchTime = 0
    this.touchCombo = 0
    
    // 图片资源管理
    this.images = new Map()
    this.imagesLoaded = new Map()
    this.imageUrls = {
      // 商店和背景
      shopBackground: 'assets/images/backgrounds/shopBackground.png',
      shopSign: 'assets/images/backgrounds/shopSign.png',
      ground: 'assets/images/backgrounds/ground.png',
      
      // 工作坊
      potionLab: 'assets/images/workshops/potionLab.png',
      enchantTable: 'assets/images/workshops/enchantTable.png',
      crystalForge: 'assets/images/workshops/crystalForge.png',
      workshopIdle: 'assets/images/workshops/workshopIdle.png',
      
      // 顾客
      normalMage: 'assets/images/customers/normalMage.png',
      adventurer: 'assets/images/customers/adventurer.png',
      noble: 'assets/images/customers/noble.png',
      urgentCustomer: 'assets/images/customers/urgentCustomer.png',
      
      // 商品图标
      potionIcon: 'assets/images/items/potionIcon.png',
      enchantmentIcon: 'assets/images/items/enchantmentIcon.png',
      crystalIcon: 'assets/images/items/crystalIcon.png',
      
      // UI元素
      progressBarBg: 'assets/images/ui/progressBarBg.png',
      progressBarFill: 'assets/images/ui/progressBarFill.png',
      patienceBarBg: 'assets/images/ui/patienceBarBg.png',
      patienceBarGreen: 'assets/images/ui/patienceBarGreen.png',
      patienceBarYellow: 'assets/images/ui/patienceBarYellow.png',
      patienceBarRed: 'assets/images/ui/patienceBarRed.png',
      
      // 特效
      goldCoin: 'assets/images/effects/goldCoin.png',
      sparkle: 'assets/images/effects/sparkle.png',
      heart: 'assets/images/effects/heart.png',
      anger: 'assets/images/effects/anger.png'
    }
    
    this.init()
  }
  
  init() {
    console.log('游戏管理器初始化')
    this.preloadImages()
    // 延迟初始化，等待管理器设置完成
  }
  
  // 预加载图片
  preloadImages() {
    Object.entries(this.imageUrls).forEach(([key, url]) => {
      try {
        // 在微信小游戏环境中使用wx.createImage()
        const img = (typeof wx !== 'undefined' && wx.createImage) ? wx.createImage() : new Image()
        
        img.onload = () => {
          this.imagesLoaded.set(key, true)
          console.log(`图片加载完成: ${key}`)
        }
        img.onerror = () => {
          console.warn(`图片加载失败，将使用备用渲染: ${key} - ${url}`)
          this.imagesLoaded.set(key, false)
        }
        img.src = url
        this.images.set(key, img)
      } catch (error) {
        console.warn(`创建图片对象失败: ${key}`, error)
        this.imagesLoaded.set(key, false)
      }
    })
  }
  
  // 检查图片是否已加载
  isImageLoaded(key) {
    return this.imagesLoaded.get(key) === true
  }
  
  // 获取图片
  getImage(key) {
    return this.images.get(key)
  }
  
  // 绘制图片（带fallback）
  drawImage(key, x, y, width, height, fallbackColor = '#CCCCCC', fallbackText = '') {
    if (this.isImageLoaded(key)) {
      const img = this.getImage(key)
      try {
        this.ctx.drawImage(img, x, y, width, height)
        return true
      } catch (e) {
        console.warn(`绘制图片失败: ${key}`, e)
      }
    }
    
    // Fallback: 绘制彩色方块和文字
    this.ctx.fillStyle = fallbackColor
    this.ctx.fillRect(x, y, width, height)
    
    if (fallbackText) {
      this.ctx.fillStyle = '#000000'
      this.ctx.font = '12px Arial'
      this.ctx.textAlign = 'center'
      this.ctx.fillText(fallbackText, x + width / 2, y + height / 2 + 4)
    }
    
    return false
  }
  
  setManagers(managers) {
    this.dataManager = managers.dataManager
    this.adManager = managers.adManager
    this.uiManager = managers.uiManager
    this.questManager = managers.questManager
    
    // 管理器设置完成后开始初始化游戏逻辑
    this.startProduction()
  }
  
  // 开始游戏
  startGame() {
    console.log('游戏开始!')
    this.gameState = 'playing'
    this.lastUpdateTime = Date.now()
    
    // 检查离线收益
    this.calculateOfflineProgress()
    if (this.offlineRewards) {
      this.showOfflineRewards()
    }
    
    // 开始生产
    this.startProduction()
  }
  
  // 暂停游戏
  pauseGame() {
    console.log('游戏暂停')
    this.gameState = 'paused'
  }
  
  // 恢复游戏
  resumeGame() {
    console.log('游戏恢复')
    this.gameState = 'playing'
    this.lastUpdateTime = Date.now()
  }
  
  update() {
    if (this.gameState !== 'playing') return
    
    const currentTime = Date.now()
    const deltaTime = currentTime - this.lastUpdateTime
    this.lastUpdateTime = currentTime
    
    // 更新生产系统
    this.updateProduction(deltaTime)
    
    // 更新顾客系统
    this.updateCustomers(deltaTime)
    
    // 更新视觉效果
    this.updateParticles(deltaTime)
    this.updateFloatingTexts(deltaTime)
    
    // 更新统计
    this.dataManager.updateStats('totalGameTime', deltaTime)
  }
  
  render() {
    // 清空画布
    this.ctx.fillStyle = '#87CEEB' // 天空蓝背景
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    
    // 绘制商店背景
    this.renderShopBackground()
    
    // 绘制生产设施
    this.renderWorkshops()
    
    // 绘制顾客
    this.renderCustomers()
    
    // 绘制非烟花类视觉效果
    this.renderNonFireworkParticles()
    this.renderFloatingTexts()
    
    // 绘制收集提示
    this.renderCollectionHints()
  }
  
  // 生产系统更新
  updateProduction(deltaTime) {
    const workshops = this.dataManager.getWorkshops()
    
    workshops.forEach(workshop => {
      if (!workshop.unlocked || !workshop.producing) return
      
      const currentTime = Date.now()
      const productionTime = currentTime - workshop.productionStartTime
      
      if (productionTime >= workshop.productionDuration) {
        // 生产完成
        this.completeProduction(workshop)
      }
    })
  }
  
  // 开始生产
  startProduction() {
    const workshops = this.dataManager.getWorkshops()
    
    workshops.forEach(workshop => {
      if (workshop.unlocked && workshop.level > 0 && !workshop.producing) {
        workshop.producing = true
        workshop.productionStartTime = Date.now()
        this.dataManager.markDirty()
      }
    })
  }
  
  // 完成生产
  completeProduction(workshop) {
    const income = this.calculateIncome(workshop)
    const itemsProduced = Math.max(1, Math.floor(workshop.level / 2))
    
    // 添加金币收益
    this.dataManager.addGold(income)
    
    // 添加库存
    this.addToInventory(workshop.id, itemsProduced)
    
    // 添加经验
    this.dataManager.addExp(workshop.level * 2)
    
    // 创建收益特效
    this.createIncomeEffect(workshop, income)
    
    // 重新开始生产
    workshop.productionStartTime = Date.now()
    
    // 触发任务事件
    this.triggerQuestEvent('item_produced', {
      itemType: this.getItemTypeFromWorkshop(workshop.id),
      amount: itemsProduced
    })
    
    this.triggerQuestEvent('production_collected', {
      workshop: workshop.id,
      timestamp: Date.now()
    })
    
    console.log(`${workshop.name} 生产完成，获得 ${income} 金币`)
  }
  
  // 计算收益
  calculateIncome(workshop) {
    let baseIncome = workshop.baseIncome * workshop.level
    
    // 商店等级加成
    const shopBonus = 1 + (this.dataManager.getShopLevel() - 1) * 0.1
    
    // 声望加成
    const reputationBonus = 1 + (this.dataManager.gameData.reputation / 1000)
    
    return Math.floor(baseIncome * shopBonus * reputationBonus)
  }
  
  // 添加到库存
  addToInventory(workshopId, amount) {
    const inventory = this.dataManager.getInventory()
    
    switch(workshopId) {
      case 'potion_lab':
        inventory.potions += amount
        break
      case 'enchant_table':
        inventory.enchantments += amount
        break
      case 'crystal_forge':
        inventory.crystals += amount
        break
    }
    
    this.dataManager.markDirty()
  }
  
  // 顾客系统更新
  updateCustomers(deltaTime) {
    this.customerSpawnTimer += deltaTime
    
    // 生成新顾客
    if (this.customerSpawnTimer >= this.customerSpawnInterval && this.customers.length < 3) {
      this.spawnCustomer()
      this.customerSpawnTimer = 0
    }
    
    // 更新现有顾客
    this.customers.forEach((customer, index) => {
      customer.waitTime += deltaTime
      
      // 顾客等待超时离开
      if (customer.waitTime > customer.patience) {
        this.customerLeave(index, false)
      }
    })
  }
  
  // 生成顾客
  spawnCustomer() {
    const customerTypes = [
      { name: '普通法师', patience: 15000, paymentMultiplier: 1.0, demand: 'potions' },
      { name: '冒险者', patience: 10000, paymentMultiplier: 1.2, demand: 'enchantments' },
      { name: '贵族', patience: 20000, paymentMultiplier: 1.5, demand: 'crystals' },
      { name: '急客', patience: 5000, paymentMultiplier: 2.0, demand: 'any' }
    ]
    
    const type = customerTypes[Math.floor(Math.random() * customerTypes.length)]
    
    // 获取UIManager提供的顾客生成区域，避免与底部UI重叠
    const spawnArea = this.uiManager.getCustomerSpawnArea()
    
    // 找一个不重叠的位置
    let position = this.findValidCustomerPosition(spawnArea)
    
    if (!position) {
      // 如果找不到有效位置，说明屏幕太拥挤，暂时不生成新顾客
      console.log('屏幕太拥挤，暂时不生成新顾客')
      return
    }
    
    const customer = {
      id: Date.now() + Math.random(),
      ...type,
      waitTime: 0,
      x: position.x,
      y: position.y,
      served: false
    }
    
    this.customers.push(customer)
    this.createCustomerEffect(customer)
    
    console.log(`新顾客到达: ${customer.name} 位置:(${customer.x}, ${customer.y})`)
    
    // 检查自动售卖功能
    this.checkAutoSell(customer)
  }
  
  // 找到有效的顾客位置（不与现有顾客重叠）
  findValidCustomerPosition(spawnArea) {
    const customerSize = 60 // 顾客占用的大致尺寸
    const minDistance = 80 // 顾客之间的最小距离
    const maxAttempts = 20 // 最大尝试次数
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // 随机生成一个位置
      const x = Math.random() * (this.canvas.width - customerSize * 2) + customerSize
      const y = Math.random() * (spawnArea.maxY - spawnArea.minY - customerSize) + spawnArea.minY
      
      // 检查这个位置是否与现有顾客重叠
      let isValidPosition = true
      
      for (let existingCustomer of this.customers) {
        const distance = Math.sqrt(
          Math.pow(x - existingCustomer.x, 2) + 
          Math.pow(y - existingCustomer.y, 2)
        )
        
        if (distance < minDistance) {
          isValidPosition = false
          break
        }
      }
      
      // 同时检查是否与工作坊重叠
      if (isValidPosition) {
        const workshops = this.dataManager.getWorkshops()
        for (let i = 0; i < workshops.length; i++) {
          if (!workshops[i].unlocked) continue
          
          const workshopRect = this.getWorkshopRect(i)
          const workshopCenterX = workshopRect.x + workshopRect.width / 2
          const workshopCenterY = workshopRect.y + workshopRect.height / 2
          
          const distanceToWorkshop = Math.sqrt(
            Math.pow(x - workshopCenterX, 2) + 
            Math.pow(y - workshopCenterY, 2)
          )
          
          if (distanceToWorkshop < minDistance) {
            isValidPosition = false
            break
          }
        }
      }
      
      if (isValidPosition) {
        return { x, y }
      }
    }
    
    // 如果经过多次尝试都找不到合适位置，返回null
    return null
  }
  
  // 服务顾客
  serveCustomer(customerIndex) {
    if (customerIndex >= this.customers.length) return
    
    const customer = this.customers[customerIndex]
    const inventory = this.dataManager.getInventory()
    
    // 检查是否有需要的商品
    let canServe = false
    let itemsNeeded = 1
    
    switch(customer.demand) {
      case 'potions':
        canServe = inventory.potions >= itemsNeeded
        break
      case 'enchantments':
        canServe = inventory.enchantments >= itemsNeeded
        break
      case 'crystals':
        canServe = inventory.crystals >= itemsNeeded
        break
      case 'any':
        canServe = inventory.potions > 0 || inventory.enchantments > 0 || inventory.crystals > 0
        break
    }
    
    if (canServe) {
      // 计算收益
      const basePrice = this.getItemPrice(customer.demand)
      const finalPrice = Math.floor(basePrice * customer.paymentMultiplier)
      
      // 扣除库存
      this.removeFromInventory(customer.demand, itemsNeeded)
      
      // 获得金币
      this.dataManager.addGold(finalPrice)
      
      // 增加声望
      this.dataManager.gameData.reputation += 10
      
      // 更新统计
      this.dataManager.updateStats('totalItemsSold', itemsNeeded)
      this.dataManager.updateStats('totalCustomersServed')
      
      // 创建收益特效
      this.createSaleEffect(customer, finalPrice)
      
      // 触发任务事件
      this.triggerQuestEvent('customer_served', {
        customerType: customer.name,
        itemType: customer.demand,
        goldEarned: finalPrice,
        timestamp: Date.now()
      })
      
      this.triggerQuestEvent('gold_earned', {
        amount: finalPrice,
        source: 'customer_service',
        timestamp: Date.now()
      })
      
      // 顾客满意离开
      this.customerLeave(customerIndex, true)
      
      console.log(`成功服务顾客，获得 ${finalPrice} 金币`)
    } else {
      // 库存不足提示
      this.showInsufficientStockNotice(customer)
    }
  }
  
  // 顾客离开
  customerLeave(customerIndex, satisfied) {
    if (customerIndex >= this.customers.length) return
    
    const customer = this.customers[customerIndex]
    
    if (satisfied) {
      // 满意度提升
      this.dataManager.gameData.customerSatisfaction = Math.min(100, 
        this.dataManager.gameData.customerSatisfaction + 5)
    } else {
      // 满意度下降
      this.dataManager.gameData.customerSatisfaction = Math.max(0, 
        this.dataManager.gameData.customerSatisfaction - 10)
      
      this.createAngryCustomerEffect(customer)
    }
    
    this.customers.splice(customerIndex, 1)
    this.dataManager.markDirty()
  }
  
  // 获取商品价格
  getItemPrice(itemType) {
    const prices = {
      'potions': 20,
      'enchantments': 50,
      'crystals': 100,
      'any': 30
    }
    return prices[itemType] || 20
  }
  
  // 从库存移除商品
  removeFromInventory(itemType, amount) {
    const inventory = this.dataManager.getInventory()
    
    switch(itemType) {
      case 'potions':
        inventory.potions = Math.max(0, inventory.potions - amount)
        break
      case 'enchantments':
        inventory.enchantments = Math.max(0, inventory.enchantments - amount)
        break
      case 'crystals':
        inventory.crystals = Math.max(0, inventory.crystals - amount)
        break
      case 'any':
        // 优先消耗最多的库存
        if (inventory.potions >= amount) {
          inventory.potions -= amount
        } else if (inventory.enchantments >= amount) {
          inventory.enchantments -= amount
        } else if (inventory.crystals >= amount) {
          inventory.crystals -= amount
        }
        break
    }
    
    this.dataManager.markDirty()
  }
  
  // 触摸处理
  handleTouch(touch) {
    // 如果传入的touch已经是转换后的canvas坐标，直接使用
    const x = touch.clientX !== undefined ? touch.clientX : touch.x
    const y = touch.clientY !== undefined ? touch.clientY : touch.y
    
    console.log('GameManager handleTouch:', x, y, touch)
    
    // 记录连击
    const currentTime = Date.now()
    if (currentTime - this.lastTouchTime < 500) {
      this.touchCombo++
    } else {
      this.touchCombo = 1
    }
    this.lastTouchTime = currentTime
    
    // 检查点击的对象
    this.checkWorkshopClick(x, y)
    this.checkCustomerClick(x, y)
    this.checkUpgradeClick(x, y)
    
    // 连击特效
    if (this.touchCombo > 3) {
      this.createComboEffect(x, y)
    }
  }
  
  // 检查设施点击 - 现在只检查统一工作台
  checkWorkshopClick(x, y) {
    const workshops = this.dataManager.getWorkshops()
    const unlockedWorkshops = workshops.filter(w => w.unlocked)
    
    if (unlockedWorkshops.length === 0) return
    
    // 检查统一工作台点击
    const unifiedRect = this.getUnifiedWorkshopRect()
    
    if (this.isPointInRect(x, y, unifiedRect)) {
      // 打开工作台详情面板
      this.uiManager.showWorkshopDetailPanel()
    }
  }
  
  // 处理设施点击
  handleWorkshopClick(workshop) {
    if (workshop.producing) {
      // 点击加速生产 (观看广告)
      this.offerProductionSpeedup(workshop)
    } else {
      // 开始生产
      workshop.producing = true
      workshop.productionStartTime = Date.now()
      this.dataManager.markDirty()
    }
  }
  
  // 提供生产加速
  offerProductionSpeedup(workshop) {
    // 检查微信API是否可用
    if (typeof wx !== 'undefined' && wx.showModal) {
      wx.showModal({
        title: '加速生产',
        content: '观看广告可以立即完成生产，是否继续？',
        confirmText: '观看广告',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            this.adManager.showSpeedUpAd((success) => {
              if (success) {
                this.completeProduction(workshop)
                this.createSpeedupEffect(workshop)
              }
            })
          }
        }
      })
    } else {
      // fallback: 直接完成生产
      console.log('微信API不可用，直接完成生产')
      this.completeProduction(workshop)
      this.createSpeedupEffect(workshop)
    }
  }
  
  // 检查顾客点击
  checkCustomerClick(x, y) {
    this.customers.forEach((customer, index) => {
      const customerRect = {
        x: customer.x - 30,
        y: customer.y - 40,
        width: 60,
        height: 80
      }
      
      if (this.isPointInRect(x, y, customerRect)) {
        this.serveCustomer(index)
      }
    })
  }
  
  // 离线收益计算
  calculateOfflineProgress() {
    if (!this.dataManager.gameData.offlineTime) return
    
    const offlineMinutes = this.dataManager.gameData.offlineTime / (1000 * 60)
    if (offlineMinutes < 1) return // 少于1分钟不计算离线收益
    
    const maxOfflineHours = 24 // 最大24小时离线收益
    const effectiveHours = Math.min(offlineMinutes / 60, maxOfflineHours)
    
    let totalOfflineGold = 0
    const workshops = this.dataManager.getWorkshops()
    
    workshops.forEach(workshop => {
      if (workshop.unlocked && workshop.level > 0) {
        const cyclesPerHour = 3600000 / workshop.productionDuration
        const totalCycles = cyclesPerHour * effectiveHours
        const workshopOfflineGold = this.calculateIncome(workshop) * totalCycles
        totalOfflineGold += workshopOfflineGold
      }
    })
    
    if (totalOfflineGold > 0) {
      this.offlineRewards = {
        gold: Math.floor(totalOfflineGold),
        time: effectiveHours
      }
    }
    
    // 重置离线时间
    this.dataManager.gameData.offlineTime = 0
    this.dataManager.markDirty()
  }
  
  // 显示离线收益
  showOfflineRewards() {
    if (!this.offlineRewards) return
    
    const hours = Math.floor(this.offlineRewards.time)
    const minutes = Math.floor((this.offlineRewards.time % 1) * 60)
    
    // 检查微信API是否可用
    if (typeof wx !== 'undefined' && wx.showModal) {
      wx.showModal({
        title: '离线收益',
        content: `离线 ${hours}小时${minutes}分钟\n获得 ${this.offlineRewards.gold} 金币\n\n观看广告可获得双倍收益！`,
        confirmText: '双倍收益',
        cancelText: '正常领取',
        success: (res) => {
          if (res.confirm) {
            // 观看广告获得双倍收益
            this.adManager.showDoubleRewardAd((success) => {
              if (success) {
                this.dataManager.addGold(this.offlineRewards.gold * 2)
                this.createOfflineRewardEffect(this.offlineRewards.gold * 2)
              } else {
                this.dataManager.addGold(this.offlineRewards.gold)
                this.createOfflineRewardEffect(this.offlineRewards.gold)
              }
              this.offlineRewards = null
            })
          } else {
            // 正常领取
            this.dataManager.addGold(this.offlineRewards.gold)
            this.createOfflineRewardEffect(this.offlineRewards.gold)
            this.offlineRewards = null
          }
        }
      })
    } else {
      // fallback: 直接给予正常收益
      console.log('微信API不可用，直接给予离线收益')
      this.dataManager.addGold(this.offlineRewards.gold)
      this.createOfflineRewardEffect(this.offlineRewards.gold)
      this.offlineRewards = null
    }
  }
  
  // 渲染方法
  renderShopBackground() {
    // 绘制魔法商店室内背景，覆盖整个画布
    this.drawImage('shopBackground', 0, 0, this.canvas.width, this.canvas.height, '#2C1810', '魔法商店室内')
    
    // 不再绘制地面，让魔法商店背景填充整个屏幕
    // 移除商店招牌的独立渲染，避免与UI重复
    // 商店标题应该由背景图片本身包含，或者完全由UIManager管理
    // 不再在这里单独绘制招牌，避免白色背景问题
  }
  
  renderWorkshops() {
    // 只渲染统一的工作台
    this.renderUnifiedWorkshop()
  }
  
  // 渲染统一工作台
  renderUnifiedWorkshop() {
    const workshops = this.dataManager.getWorkshops()
    const unlockedWorkshops = workshops.filter(w => w.unlocked)
    
    if (unlockedWorkshops.length === 0) return
    
    // 使用药水实验室的位置作为统一工作台位置
    const rect = this.getUnifiedWorkshopRect()
    
    // 检查是否有任何工作台在生产
    const anyProducing = unlockedWorkshops.some(w => w.producing)
    
    // 绘制统一工作台背景
    const gradient = this.ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.height)
    if (anyProducing) {
      gradient.addColorStop(0, '#4CAF50')
      gradient.addColorStop(1, '#388E3C')
    } else {
      gradient.addColorStop(0, '#9E9E9E')
      gradient.addColorStop(1, '#757575')
    }
    this.ctx.fillStyle = gradient
    this.ctx.fillRect(rect.x, rect.y, rect.width, rect.height)
    
    // 魔法边框
    this.ctx.strokeStyle = '#FFD700'
    this.ctx.lineWidth = 3
    this.ctx.strokeRect(rect.x, rect.y, rect.width, rect.height)
    
    // 绘制工作台图标 - 使用组合图标
    this.drawImage('potionLab', rect.x + 5, rect.y + 5, 25, 25, '#8B4513', '药水')
    this.drawImage('enchantTable', rect.x + 35, rect.y + 5, 25, 25, '#9C27B0', '附魔')
    this.drawImage('crystalForge', rect.x + 65, rect.y + 5, 25, 25, '#FF5722', '水晶')
    
    // 绘制统一标题
    this.ctx.fillStyle = '#FFFFFF'
    this.ctx.font = 'bold 14px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('工作台', rect.x + rect.width / 2, rect.y + 50)
    
    // 显示工作台数量
    this.ctx.font = '12px Arial'
    this.ctx.fillText(`${unlockedWorkshops.length}个设施`, rect.x + rect.width / 2, rect.y + 65)
    
    // 显示生产状态
    const producingCount = unlockedWorkshops.filter(w => w.producing).length
    if (producingCount > 0) {
      this.ctx.fillStyle = '#00FF00'
      this.ctx.fillText(`${producingCount}个生产中`, rect.x + rect.width / 2, rect.y + rect.height + 15)
    } else {
      this.ctx.fillStyle = '#FFFF00'
      this.ctx.fillText('点击管理', rect.x + rect.width / 2, rect.y + rect.height + 15)
    }
  }
  
  // 获取统一工作台位置
  getUnifiedWorkshopRect() {
    const topMargin = 88 + 35 + 10 // 状态栏高度 + 标题高度 + 间距
    return {
      x: 20, // 左上角位置，与原药水实验室位置相同
      y: topMargin,
      width: 90, // 稍微增大以容纳更多信息
      height: 80
    }
  }
  
  renderProductionProgress(workshop, rect) {
    const currentTime = Date.now()
    const productionTime = currentTime - workshop.productionStartTime
    const progress = Math.min(1, productionTime / workshop.productionDuration)
    
    // 进度条背景
    this.drawImage('progressBarBg', rect.x, rect.y + rect.height + 5, rect.width, 8, '#333333', '')
    
    // 进度条填充
    const fillWidth = rect.width * progress
    if (fillWidth > 0) {
      this.drawImage('progressBarFill', rect.x, rect.y + rect.height + 5, fillWidth, 8, '#00FF00', '')
    }
  }
  
  renderCustomers() {
    this.customers.forEach(customer => {
      // 根据顾客类型选择图片
      let imageKey = 'normalMage'
      switch(customer.name) {
        case '普通法师':
          imageKey = 'normalMage'
          break
        case '冒险者':
          imageKey = 'adventurer'
          break
        case '贵族':
          imageKey = 'noble'
          break
        case '急客':
          imageKey = 'urgentCustomer'
          break
      }
      
      // 绘制顾客图片 - 增大尺寸
      const fallbackColor = this.getCustomerColor(customer.name)
      this.drawImage(imageKey, customer.x - 25, customer.y - 40, 50, 80, fallbackColor, customer.name)
      
      // 绘制顾客名称 - 增大字体
      this.ctx.fillStyle = '#000000'
      this.ctx.font = 'bold 16px Arial'
      this.ctx.textAlign = 'center'
      this.ctx.fillText(customer.name, customer.x, customer.y - 45)
      
      // 绘制需求图标和文字
      this.renderCustomerDemand(customer)
      
      // 绘制耐心值
      this.renderCustomerPatience(customer)
    })
  }
  
  // 绘制顾客需求
  renderCustomerDemand(customer) {
    // 绘制需求图标
    let iconKey = 'potionIcon'
    switch(customer.demand) {
      case 'potions':
        iconKey = 'potionIcon'
        break
      case 'enchantments':
        iconKey = 'enchantmentIcon'
        break
      case 'crystals':
        iconKey = 'crystalIcon'
        break
      case 'any':
        iconKey = 'potionIcon' // 默认显示药水图标
        break
    }
    
    // 绘制需求图标 - 增大尺寸
    this.drawImage(iconKey, customer.x - 20, customer.y + 25, 40, 40, '#CCCCCC', '需求')
    
    // 绘制需求文字 - 增大字体和调整位置
    this.ctx.fillStyle = '#000000'
    this.ctx.font = 'bold 14px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText(this.getDemandText(customer.demand), customer.x, customer.y + 75)
  }
  
  renderCustomerPatience(customer) {
    const patiencePercent = Math.max(0, 1 - (customer.waitTime / customer.patience))
    const barWidth = 50  // 增大耐心条宽度
    const barHeight = 6   // 增大耐心条高度
    
    // 耐心条背景
    this.drawImage('patienceBarBg', customer.x - barWidth / 2, customer.y + 80, barWidth, barHeight, '#333333', '')
    
    // 耐心条填充
    const fillWidth = barWidth * patiencePercent
    if (fillWidth > 0) {
      let barImageKey = 'patienceBarGreen'
      if (patiencePercent <= 0.3) {
        barImageKey = 'patienceBarRed'
      } else if (patiencePercent <= 0.6) {
        barImageKey = 'patienceBarYellow'
      }
      
      const color = patiencePercent > 0.6 ? '#00FF00' : 
                    patiencePercent > 0.3 ? '#FFFF00' : '#FF0000'
      this.drawImage(barImageKey, customer.x - barWidth / 2, customer.y + 80, fillWidth, barHeight, color, '')
    }
  }
  
  renderParticles() {
    this.particles.forEach(particle => {
      // 根据粒子类型绘制不同的图标
      if (particle.imageKey) {
        this.drawImage(particle.imageKey, particle.x - particle.size/2, particle.y - particle.size/2, 
                      particle.size, particle.size, particle.color, '')
      } else if (particle.type === 'firework' || particle.type === 'sparkle') {
        // 烟花和闪烁粒子使用圆形渲染
        this.ctx.fillStyle = particle.color
        this.ctx.beginPath()
        this.ctx.arc(particle.x, particle.y, particle.size || 2, 0, Math.PI * 2)
        this.ctx.fill()
        
        // 添加发光效果
        if (particle.type === 'sparkle') {
          this.ctx.shadowColor = particle.color
          this.ctx.shadowBlur = 5
          this.ctx.beginPath()
          this.ctx.arc(particle.x, particle.y, (particle.size || 2) * 0.5, 0, Math.PI * 2)
          this.ctx.fill()
          this.ctx.shadowBlur = 0
        }
      } else {
        // 默认方块粒子
        this.ctx.fillStyle = particle.color
        this.ctx.fillRect(particle.x - 2, particle.y - 2, 4, 4)
      }
    })
  }
  
  // 渲染非烟花类粒子（在UI层之前）
  renderNonFireworkParticles() {
    this.particles.filter(particle => particle.type !== 'firework' && particle.type !== 'sparkle').forEach(particle => {
      // 根据粒子类型绘制不同的图标
      if (particle.imageKey) {
        this.drawImage(particle.imageKey, particle.x - particle.size/2, particle.y - particle.size/2, 
                      particle.size, particle.size, particle.color, '')
      } else {
        // 默认方块粒子
        this.ctx.fillStyle = particle.color
        this.ctx.fillRect(particle.x - 2, particle.y - 2, 4, 4)
      }
    })
  }
  
  // 仅渲染烟花类粒子（在UI层之后，最顶层）
  renderFireworkParticles() {
    this.particles.filter(particle => particle.type === 'firework' || particle.type === 'sparkle').forEach(particle => {
      // 烟花和闪烁粒子使用圆形渲染
      this.ctx.fillStyle = particle.color
      this.ctx.beginPath()
      this.ctx.arc(particle.x, particle.y, particle.size || 2, 0, Math.PI * 2)
      this.ctx.fill()
      
      // 添加发光效果
      if (particle.type === 'sparkle') {
        this.ctx.shadowColor = particle.color
        this.ctx.shadowBlur = 5
        this.ctx.beginPath()
        this.ctx.arc(particle.x, particle.y, (particle.size || 2) * 0.5, 0, Math.PI * 2)
        this.ctx.fill()
        this.ctx.shadowBlur = 0
      }
    })
  }
  
  renderFloatingTexts() {
    this.floatingTexts.forEach(text => {
      this.ctx.fillStyle = text.color
      this.ctx.font = `${text.size}px Arial`
      this.ctx.textAlign = 'center'
      this.ctx.fillText(text.text, text.x, text.y)
    })
  }
  
  renderCollectionHints() {
    const workshops = this.dataManager.getWorkshops()
    
    workshops.forEach((workshop, index) => {
      if (!workshop.unlocked || !workshop.producing) return
      
      const currentTime = Date.now()
      const productionTime = currentTime - workshop.productionStartTime
      
      if (productionTime >= workshop.productionDuration) {
        // 显示收集提示
        const rect = this.getWorkshopRect(index)
        this.ctx.fillStyle = '#FFD700'
        this.ctx.font = '16px Arial'
        this.ctx.textAlign = 'center'
        this.ctx.fillText('点击收集!', rect.x + rect.width / 2, rect.y - 30)
      }
    })
  }
  
  // 辅助方法
  getWorkshopRect(index) {
    const workshops = this.dataManager.getWorkshops()
    const workshop = workshops[index]
    
    // 药水实验室特殊定位 - 左上角，状态栏下方
    if (workshop && workshop.id === 'potion_lab') {
      const topMargin = 88 + 35 + 10 // 状态栏高度 + 标题高度 + 间距
      return {
        x: 20, // 左上角位置
        y: topMargin,
        width: 80,
        height: 80
      }
    }
    
    // 其他工作坊保持原有布局，但需要跳过药水实验室的位置
    const baseY = 250
    let adjustedIndex = index
    
    // 如果不是药水实验室，需要调整索引（因为药水实验室不占用原有布局位置）
    if (workshop && workshop.id !== 'potion_lab') {
      // 找到药水实验室的索引
      const potionLabIndex = workshops.findIndex(w => w.id === 'potion_lab')
      if (potionLabIndex !== -1 && index > potionLabIndex) {
        adjustedIndex = index - 1 // 减1是因为药水实验室不占用水平布局空间
      }
    }
    
    const spacing = 120
    return {
      x: 50 + adjustedIndex * spacing,
      y: baseY,
      width: 80,
      height: 80
    }
  }
  
  getCustomerColor(customerName) {
    const colors = {
      '普通法师': '#4169E1',
      '冒险者': '#8B4513',
      '贵族': '#9370DB',
      '急客': '#FF4500'
    }
    return colors[customerName] || '#808080'
  }
  
  getDemandText(demand) {
    const texts = {
      'potions': '需要药水',
      'enchantments': '需要附魔',
      'crystals': '需要水晶',
      'any': '任意商品'
    }
    return texts[demand] || '未知需求'
  }
  
  isPointInRect(x, y, rect) {
    return x >= rect.x && x <= rect.x + rect.width &&
           y >= rect.y && y <= rect.y + rect.height
  }
  
  // 特效创建方法
  createIncomeEffect(workshop, income) {
    const rect = this.getWorkshopRect(this.dataManager.getWorkshops().indexOf(workshop))
    this.createFloatingText(`+${income}金币`, rect.x + rect.width / 2, rect.y, '#FFD700')
    this.createParticleEffect(rect.x + rect.width / 2, rect.y, '#FFD700', 10)
  }
  
  createSaleEffect(customer, income) {
    this.createFloatingText(`+${income}金币`, customer.x, customer.y - 20, '#00FF00')
    this.createParticleEffect(customer.x, customer.y, '#00FF00', 8)
  }
  
  createOfflineRewardEffect(amount) {
    this.createFloatingText(`离线收益 +${amount}金币!`, this.canvas.width / 2, this.canvas.height / 2, '#FF6B6B', 24)
  }
  
  createFloatingText(text, x, y, color = '#FFFFFF', size = 16) {
    this.floatingTexts.push({
      text,
      x,
      y,
      color,
      size,
      life: 2000,
      startTime: Date.now()
    })
  }
  
  createParticleEffect(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        color,
        life: 1000,
        startTime: Date.now()
      })
    }
  }
  
  updateParticles(deltaTime) {
    this.particles = this.particles.filter(particle => {
      particle.x += particle.vx
      particle.y += particle.vy
      particle.vy += 0.1 // 重力
      
      const age = Date.now() - particle.startTime
      return age < particle.life
    })
  }
  
  updateFloatingTexts(deltaTime) {
    this.floatingTexts = this.floatingTexts.filter(text => {
      text.y -= 1 // 向上漂浮
      
      const age = Date.now() - text.startTime
      return age < text.life
    })
  }
  
  // 库存不足提示
  showInsufficientStockNotice(customer) {
    // 使用UIManager的居中提示功能
    this.uiManager.showInsufficientStockNotice()
    
    // 同时创建顾客处的浮动文字
    this.createFloatingText('库存不足!', customer.x, customer.y - 60, '#FF0000')
  }
  
  // 愤怒顾客特效
  createAngryCustomerEffect(customer) {
    this.createFloatingText('不满意!', customer.x, customer.y - 40, '#FF0000')
    this.createParticleEffect(customer.x, customer.y, '#FF0000', 5)
  }
  
  // 加速特效
  createSpeedupEffect(workshop) {
    const rect = this.getWorkshopRect(this.dataManager.getWorkshops().indexOf(workshop))
    this.createFloatingText('加速完成!', rect.x + rect.width / 2, rect.y - 40, '#00FFFF')
    this.createParticleEffect(rect.x + rect.width / 2, rect.y, '#00FFFF', 15)
  }
  
  // 连击特效
  createComboEffect(x, y) {
    this.createFloatingText(`${this.touchCombo}连击!`, x, y, '#FF69B4', 20)
    this.createParticleEffect(x, y, '#FF69B4', this.touchCombo * 2)
  }
  
  // 顾客特效
  createCustomerEffect(customer) {
    this.createParticleEffect(customer.x, customer.y, '#FFFF00', 6)
  }
  
  // 检查升级点击
  checkUpgradeClick(x, y) {
    // 这里可以添加升级按钮的点击检测
    // 由UIManager处理具体的UI交互
  }
  
  // 升级工作坊
  upgradeWorkshop(workshopIndex) {
    const workshops = this.dataManager.getWorkshops()
    if (workshopIndex >= workshops.length) {
      console.warn('无效的工作坊索引:', workshopIndex)
      return false
    }
    
    const workshop = workshops[workshopIndex]
    
    // 计算升级费用
    const goldCost = workshop.upgradeGoldCost || (workshop.level * 100)
    const gemCost = workshop.upgradeGemCost || 0
    
    // 检查是否有足够资源
    const canAffordGold = this.dataManager.getGold() >= goldCost
    const canAffordGems = this.dataManager.getGems() >= gemCost
    
    if (!canAffordGold || !canAffordGems) {
      console.log('资源不足，无法升级')
      
      // 显示资源不足提示
      let message = '升级失败: '
      if (!canAffordGold) {
        message += `需要 ${goldCost} 金币 `
      }
      if (!canAffordGems) {
        message += `需要 ${gemCost} 宝石`
      }
      
      this.createFloatingText(message, this.canvas.width / 2, this.canvas.height / 2, '#FF0000', 16)
      return false
    }
    
    // 扣除资源
    this.dataManager.spendGold(goldCost)
    if (gemCost > 0) {
      this.dataManager.spendGems(gemCost)
    }
    
    // 升级工作坊
    const oldLevel = workshop.level
    workshop.level += 1
    
    // 更新工作坊属性
    this.updateWorkshopStats(workshop)
    
    // 增加经验
    this.dataManager.addExp(workshop.level * 10)
    
    // 触发任务事件
    this.triggerQuestEvent('workshop_upgraded', {
      workshopId: workshop.id,
      workshopName: workshop.name,
      oldLevel: oldLevel,
      newLevel: workshop.level,
      goldSpent: goldCost,
      gemsSpent: gemCost,
      timestamp: Date.now()
    })
    
    this.triggerQuestEvent('gold_spent', {
      amount: goldCost,
      purpose: 'workshop_upgrade',
      timestamp: Date.now()
    })
    
    if (gemCost > 0) {
      this.triggerQuestEvent('gems_spent', {
        amount: gemCost,
        purpose: 'workshop_upgrade',
        timestamp: Date.now()
      })
    }
    
    // 创建升级特效
    this.createUpgradeEffect(workshop, workshopIndex)
    
    // 保存数据
    this.dataManager.markDirty()
    
    console.log(`${workshop.name} 从 Lv.${oldLevel} 升级到 Lv.${workshop.level}`)
    return true
  }
  
  // 更新工作坊属性
  updateWorkshopStats(workshop) {
    // 根据等级更新生产速度和收益
    switch(workshop.id) {
      case 'potion_lab':
        workshop.productionDuration = Math.max(1000, 5000 - (workshop.level - 1) * 200) // 最快1秒
        workshop.baseIncome = 10 + workshop.level * 5
        break
      case 'enchant_table':
        workshop.productionDuration = Math.max(1500, 8000 - (workshop.level - 1) * 300) // 最快1.5秒
        workshop.baseIncome = 20 + workshop.level * 8
        break
      case 'crystal_forge':
        workshop.productionDuration = Math.max(2000, 12000 - (workshop.level - 1) * 400) // 最快2秒
        workshop.baseIncome = 50 + workshop.level * 15
        break
    }
    
    // 更新升级费用（每次升级后费用递增）
    workshop.upgradeGoldCost = workshop.level * 150
    workshop.upgradeGemCost = Math.max(0, workshop.level - 5) // 6级开始需要宝石
  }
  
  // 升级特效
  createUpgradeEffect(workshop, workshopIndex) {
    const rect = this.getWorkshopRect(workshopIndex)
    
    // 升级浮动文字
    this.createFloatingText(`${workshop.name} 升级!`, rect.x + rect.width / 2, rect.y - 30, '#FFD700', 18)
    this.createFloatingText(`Lv.${workshop.level}`, rect.x + rect.width / 2, rect.y - 10, '#FFFFFF', 16)
    
    // 升级特效粒子
    this.createParticleEffect(rect.x + rect.width / 2, rect.y + rect.height / 2, '#FFD700', 20)
    this.createParticleEffect(rect.x + rect.width / 2, rect.y + rect.height / 2, '#FFFFFF', 15)
  }
  
  // 检查自动售卖功能
  checkAutoSell(customer) {
    // 检查设置中是否启用了自动售卖
    if (!this.dataManager.gameData.settings.autoSellEnabled) {
      return
    }
    
    const inventory = this.dataManager.getInventory()
    
    // 检查是否有需要的商品
    let canAutoSell = false
    let itemsNeeded = 1
    
    switch(customer.demand) {
      case 'potions':
        canAutoSell = inventory.potions >= itemsNeeded
        break
      case 'enchantments':
        canAutoSell = inventory.enchantments >= itemsNeeded
        break
      case 'crystals':
        canAutoSell = inventory.crystals >= itemsNeeded
        break
      case 'any':
        canAutoSell = inventory.potions > 0 || inventory.enchantments > 0 || inventory.crystals > 0
        break
    }
    
    if (canAutoSell) {
      // 延迟1秒后自动售卖，模拟服务时间
      setTimeout(() => {
        // 再次检查顾客是否还在（防止在延迟期间手动服务或顾客离开）
        const customerIndex = this.customers.findIndex(c => c.id === customer.id)
        if (customerIndex !== -1 && !this.customers[customerIndex].served) {
          this.autoServeCustomer(customerIndex)
        }
      }, 1000)
    }
  }
  
  // 自动服务顾客
  autoServeCustomer(customerIndex) {
    if (customerIndex >= this.customers.length) return
    
    const customer = this.customers[customerIndex]
    const inventory = this.dataManager.getInventory()
    
    // 检查是否有需要的商品（再次确认）
    let canServe = false
    let itemsNeeded = 1
    
    switch(customer.demand) {
      case 'potions':
        canServe = inventory.potions >= itemsNeeded
        break
      case 'enchantments':
        canServe = inventory.enchantments >= itemsNeeded
        break
      case 'crystals':
        canServe = inventory.crystals >= itemsNeeded
        break
      case 'any':
        canServe = inventory.potions > 0 || inventory.enchantments > 0 || inventory.crystals > 0
        break
    }
    
    if (canServe) {
      // 计算收益
      const basePrice = this.getItemPrice(customer.demand)
      const finalPrice = Math.floor(basePrice * customer.paymentMultiplier)
      
      // 扣除库存
      this.removeFromInventory(customer.demand, itemsNeeded)
      
      // 获得金币
      this.dataManager.addGold(finalPrice)
      
      // 增加声望
      this.dataManager.gameData.reputation += 10
      
      // 更新统计
      this.dataManager.updateStats('totalItemsSold', itemsNeeded)
      this.dataManager.updateStats('totalCustomersServed')
      
      // 触发任务事件 - 这是修复的关键！
      this.triggerQuestEvent('customer_served', {
        customerType: customer.name,
        itemType: customer.demand,
        goldEarned: finalPrice,
        isAutoSell: true, // 标记为自动售卖
        timestamp: Date.now()
      })
      
      this.triggerQuestEvent('gold_earned', {
        amount: finalPrice,
        source: 'auto_sell_service',
        timestamp: Date.now()
      })
      
      // 创建自动售卖特效
      this.createAutoSaleEffect(customer, finalPrice)
      
      // 顾客满意离开
      this.customerLeave(customerIndex, true)
      
      console.log(`自动服务顾客，获得 ${finalPrice} 金币`)
    }
  }
  
  // 创建自动售卖特效
  createAutoSaleEffect(customer, income) {
    this.createFloatingText(`自动售卖 +${income}金币`, customer.x, customer.y - 20, '#00FFFF')
    this.createParticleEffect(customer.x, customer.y, '#00FFFF', 8)
    
    // 添加自动售卖标识特效
    this.createFloatingText('🤖', customer.x + 30, customer.y - 40, '#00FF00', 20)
  }
  
  // 创建轻型烟花效果
  createFireworkEffect(x, y, color = '#FFD700') {
    // 创建烟花爆炸的粒子数量（轻型）
    const particleCount = 12
    const colors = [color, '#FFFFFF', '#FFFF00', '#FF6B6B', '#4ECDC4']
    
    // 创建中心爆炸粒子
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount
      const speed = 2 + Math.random() * 3
      
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 3 + Math.random() * 2,
        life: 800 + Math.random() * 400,
        startTime: Date.now(),
        type: 'firework'
      })
    }
    
    // 创建额外的闪烁粒子
    for (let i = 0; i < 6; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 10,
        vx: (Math.random() - 0.5) * 1,
        vy: (Math.random() - 0.5) * 1,
        color: '#FFFFFF',
        size: 2,
        life: 600,
        startTime: Date.now(),
        type: 'sparkle'
      })
    }
    
    // 创建烟花爆炸的浮动文字
    this.createFloatingText('✨', x, y - 10, color, 16)
    
    console.log(`创建烟花效果于位置 (${x}, ${y})`)
  }
  
  // 触发任务事件
  triggerQuestEvent(eventType, data = {}) {
    if (this.questManager) {
      this.questManager.updateQuestProgress(eventType, data)
    }
  }
  
  // 获取工作台类型
  getItemTypeFromWorkshop(workshopId) {
    switch(workshopId) {
      case 'potion_lab':
        return 'potions'
      case 'enchant_table':
        return 'enchantments'
      case 'crystal_forge':
        return 'crystals'
      default:
        return 'unknown'
    }
  }
}
