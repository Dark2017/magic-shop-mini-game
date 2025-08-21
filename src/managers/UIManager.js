// UI管理器 - 处理游戏界面显示和用户交互
export default class UIManager {
  constructor(ctx, canvas) {
    this.ctx = ctx
    this.canvas = canvas
    this.dataManager = null
    this.adManager = null
    this.gameManager = null
    
    // UI状态
    this.showingUpgradePanel = false
    this.showingStatsPanel = false
    this.showingStartScreen = true
    this.gamePaused = false
    this.selectedWorkshop = null
    this.bottomBarCollapsed = false
    this.showingInsufficientStockNotice = false
    this.showingWorkshopDetailPanel = false
    
    // 设备适配参数
    this.deviceInfo = this.getDeviceInfo()
    this.safeArea = this.calculateSafeArea()
    
    // UI尺寸配置
    this.uiConfig = {
      topBarHeight: Math.max(this.safeArea.top + 100, 120), // 确保足够的顶部空间，增加更多缓冲
      bottomBarHeight: 120, // 增加底部高度
      buttonMinSize: 50, // 增大最小触摸尺寸
      padding: 20, // 增大间距到至少10px的2倍，确保所有元素都有足够空间
      borderRadius: 12 // 增大圆角
    }
    
    // UI元素位置 - 动态计算
    this.uiElements = {}
    this.calculateUIElements()
    
    // 调整UI元素位置适应屏幕
    this.adjustUIForScreen()
  }
  
  setManagers(managers) {
    this.dataManager = managers.dataManager
    this.adManager = managers.adManager
    this.gameManager = managers.gameManager
  }
  
  update() {
    // UI更新逻辑
    this.updateAnimations()
  }
  
  render() {
    // 如果显示开始页面
    if (this.showingStartScreen) {
      this.renderStartScreen()
      return
    }
    
    // 渲染主要UI元素
    this.renderTopBar()
    this.renderBottomBar()
    
    // 如果游戏暂停，显示暂停遮罩
    if (this.gamePaused) {
      this.renderPauseOverlay()
    }
    
    // 渲染面板
    if (this.showingUpgradePanel) {
      this.renderUpgradePanel()
    }
    
    if (this.showingStatsPanel) {
      this.renderStatsPanel()
    }
    
    if (this.showingWorkshopDetailPanel) {
      this.renderWorkshopDetailPanel()
    }
    
    // 渲染库存不足提示（最高层级）
    if (this.showingInsufficientStockNotice) {
      this.renderCenteredInsufficientStockNotice('请生产更多商品或升级设施！')
    }
    
    // 渲染提示信息
    this.renderNotifications()
  }
  
  // 顶部信息栏 - 单行布局，去掉emoji
  renderTopBar() {
    const { padding } = this.uiConfig
    const fixedTopMargin = 88
    
    // 魔法商店标题 - 去掉emoji，使用文字
    this.ctx.fillStyle = '#FFD700'
    this.ctx.font = 'bold 16px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.strokeStyle = '#8B4513'
    this.ctx.lineWidth = 2
    this.ctx.strokeText('魔法商店', this.canvas.width / 2, fixedTopMargin - 35)
    this.ctx.fillText('魔法商店', this.canvas.width / 2, fixedTopMargin - 35)
    
    // 单行显示：金币、宝石、等级 - 去掉emoji
    this.renderResourceDisplay(
      this.uiElements.goldDisplay,
      '金币',
      this.formatNumber(this.dataManager.getGold()),
      '#FFD700'
    )
    
    this.renderResourceDisplay(
      this.uiElements.gemsDisplay,
      '宝石',
      this.dataManager.getGems().toString(),
      '#FF69B4'
    )
    
    this.renderLevelDisplay()
    
    // 右上角按钮 - 保持同一行
    this.renderSmallCircleButton(this.uiElements.pauseButton, '暂停', '#FF9800')
    this.renderSmallCircleButton(this.uiElements.menuButton, '设置', '#4CAF50')
  }
  
  // 底部操作栏 - 添加收缩功能
  renderBottomBar() {
    const { bottomBarHeight, padding } = this.uiConfig
    
    // 如果面板收缩，只显示展开按钮
    if (this.bottomBarCollapsed) {
      // 小的半透明背景
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
      this.ctx.fillRect(0, this.canvas.height - 40, this.canvas.width, 40)
      this.renderButton(this.uiElements.expandButton, '⬆️', '#4CAF50')
      return
    }
    
    // 正常状态：显示完整底部栏
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
    this.ctx.fillRect(0, this.canvas.height - bottomBarHeight, this.canvas.width, bottomBarHeight)
    
    // 显示所有按钮（去掉升级按钮，添加工作台管理按钮和自动售卖按钮）
    this.renderButton(this.uiElements.statsButton, '📊 统计', '#FF9800')
    this.renderButton(this.uiElements.workshopButton, '🏭 工作台', '#4CAF50')
    this.renderAutoSellButton()
    this.renderButton(this.uiElements.collapseButton, '⬇️', '#757575')
  }
  
  // 按钮渲染
  renderButton(rect, text, color) {
    const { borderRadius } = this.uiConfig
    
    // 检查是否支持 roundRect API
    if (this.ctx.roundRect && typeof this.ctx.roundRect === 'function') {
      try {
        // 绘制圆角矩形背景
        this.ctx.fillStyle = color
        this.ctx.beginPath()
        this.ctx.roundRect(rect.x, rect.y, rect.width, rect.height, [borderRadius])
        this.ctx.fill()
        
        // 按钮边框
        this.ctx.strokeStyle = '#FFFFFF'
        this.ctx.lineWidth = 2
        this.ctx.beginPath()
        this.ctx.roundRect(rect.x, rect.y, rect.width, rect.height, [borderRadius])
        this.ctx.stroke()
      } catch (e) {
        // 如果roundRect调用失败，降级到普通矩形
        console.warn('roundRect API调用失败，使用普通矩形:', e)
        this.ctx.fillStyle = color
        this.ctx.fillRect(rect.x, rect.y, rect.width, rect.height)
        
        // 按钮边框
        this.ctx.strokeStyle = '#FFFFFF'
        this.ctx.lineWidth = 2
        this.ctx.strokeRect(rect.x, rect.y, rect.width, rect.height)
      }
    } else {
      // 降级到普通矩形
      this.ctx.fillStyle = color
      this.ctx.fillRect(rect.x, rect.y, rect.width, rect.height)
      
      // 按钮边框
      this.ctx.strokeStyle = '#FFFFFF'
      this.ctx.lineWidth = 2
      this.ctx.strokeRect(rect.x, rect.y, rect.width, rect.height)
    }
    
    // 按钮文字
    this.ctx.fillStyle = '#FFFFFF'
    this.ctx.font = '14px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText(text, rect.x + rect.width / 2, rect.y + rect.height / 2 + 5)
  }
  
  // 自动售卖按钮渲染
  renderAutoSellButton() {
    const rect = this.uiElements.autoSellButton
    const isEnabled = this.dataManager.gameData.settings && this.dataManager.gameData.settings.autoSellEnabled
    const { borderRadius } = this.uiConfig
    
    // 根据状态选择颜色和样式
    let backgroundColor, borderColor, textColor, statusColor
    
    if (isEnabled) {
      // 开启状态：明亮高亮
      backgroundColor = '#00FF00'  // 明亮绿色
      borderColor = '#00CC00'      // 深绿色边框
      textColor = '#FFFFFF'        // 白色文字
      statusColor = '#FFFFFF'      // 白色状态点
    } else {
      // 关闭状态：灰色置灰
      backgroundColor = '#555555'  // 深灰色
      borderColor = '#333333'      // 更深的灰色边框
      textColor = '#AAAAAA'        // 浅灰色文字
      statusColor = '#FF4444'      // 红色状态点
    }
    
    // 检查是否支持 roundRect API
    if (this.ctx.roundRect && typeof this.ctx.roundRect === 'function') {
      try {
        // 绘制圆角矩形背景
        this.ctx.fillStyle = backgroundColor
        this.ctx.beginPath()
        this.ctx.roundRect(rect.x, rect.y, rect.width, rect.height, [borderRadius])
        this.ctx.fill()
        
        // 按钮边框
        this.ctx.strokeStyle = borderColor
        this.ctx.lineWidth = 2
        this.ctx.beginPath()
        this.ctx.roundRect(rect.x, rect.y, rect.width, rect.height, [borderRadius])
        this.ctx.stroke()
      } catch (e) {
        // 如果roundRect调用失败，降级到普通矩形
        this.ctx.fillStyle = backgroundColor
        this.ctx.fillRect(rect.x, rect.y, rect.width, rect.height)
        
        this.ctx.strokeStyle = borderColor
        this.ctx.lineWidth = 2
        this.ctx.strokeRect(rect.x, rect.y, rect.width, rect.height)
      }
    } else {
      // 降级到普通矩形
      this.ctx.fillStyle = backgroundColor
      this.ctx.fillRect(rect.x, rect.y, rect.width, rect.height)
      
      this.ctx.strokeStyle = borderColor
      this.ctx.lineWidth = 2
      this.ctx.strokeRect(rect.x, rect.y, rect.width, rect.height)
    }
    
    // 按钮文字
    this.ctx.fillStyle = textColor
    this.ctx.font = isEnabled ? 'bold 14px Arial' : '14px Arial'  // 开启时使用粗体
    this.ctx.textAlign = 'center'
    this.ctx.fillText('🤖 自动售卖', rect.x + rect.width / 2, rect.y + rect.height / 2 + 5)
    
    // 添加发光效果（仅在开启时）
    if (isEnabled) {
      // 外发光效果
      this.ctx.shadowColor = '#00FF00'
      this.ctx.shadowBlur = 8
      this.ctx.strokeStyle = '#00FF00'
      this.ctx.lineWidth = 1
      this.ctx.strokeRect(rect.x - 1, rect.y - 1, rect.width + 2, rect.height + 2)
      this.ctx.shadowBlur = 0  // 重置阴影
    }
    
    // 状态指示器 - 更大更明显
    const statusX = rect.x + rect.width - 10
    const statusY = rect.y + 10
    const statusRadius = 5
    
    // 状态指示器背景（深色圆圈）
    this.ctx.fillStyle = '#000000'
    this.ctx.beginPath()
    this.ctx.arc(statusX, statusY, statusRadius + 1, 0, 2 * Math.PI)
    this.ctx.fill()
    
    // 状态指示器主体
    this.ctx.fillStyle = statusColor
    this.ctx.beginPath()
    this.ctx.arc(statusX, statusY, statusRadius, 0, 2 * Math.PI)
    this.ctx.fill()
    
    // 状态指示器边框
    this.ctx.strokeStyle = '#FFFFFF'
    this.ctx.lineWidth = 1.5
    this.ctx.beginPath()
    this.ctx.arc(statusX, statusY, statusRadius, 0, 2 * Math.PI)
    this.ctx.stroke()
    
    // 开启时添加闪烁效果
    if (isEnabled) {
      const time = Date.now()
      const pulse = Math.sin(time * 0.005) * 0.3 + 0.7  // 脉动效果
      this.ctx.fillStyle = `rgba(255, 255, 255, ${pulse})`
      this.ctx.beginPath()
      this.ctx.arc(statusX, statusY, statusRadius * 0.6, 0, 2 * Math.PI)
      this.ctx.fill()
    }
  }
  
  // 小尺寸圆形按钮渲染 - 为右上角按钮设计，增大尺寸和改善居中
  renderSmallCircleButton(rect, icon, color) {
    const centerX = rect.x + rect.width / 2
    const centerY = rect.y + rect.height / 2
    const radius = Math.min(rect.width, rect.height) / 2 - 2 // 增加padding
    
    // 圆形背景 - 半透明
    this.ctx.fillStyle = color + 'DD' // 增加透明度
    this.ctx.beginPath()
    this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
    this.ctx.fill()
    
    // 圆形边框
    this.ctx.strokeStyle = '#FFFFFF'
    this.ctx.lineWidth = 2
    this.ctx.beginPath()
    this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
    this.ctx.stroke()
    
    // 图标 - 改善居中和大小
    this.ctx.fillStyle = '#FFFFFF'
    this.ctx.font = 'bold 10px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    this.ctx.fillText(icon, centerX, centerY)
    this.ctx.textBaseline = 'alphabetic' // 重置为默认
  }
  
  // 宽松的资源显示 - 更大更清晰，防止文字遮挡
  renderResourceDisplay(rect, icon, value, color) {
    // 背景 - 使用魔法主题样式
    const gradient = this.ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.height)
    gradient.addColorStop(0, 'rgba(139, 69, 19, 0.8)')
    gradient.addColorStop(1, 'rgba(101, 67, 33, 0.9)')
    this.ctx.fillStyle = gradient
    this.ctx.fillRect(rect.x, rect.y, rect.width, rect.height)
    
    // 魔法边框
    this.ctx.strokeStyle = '#FFD700'
    this.ctx.lineWidth = 2
    this.ctx.strokeRect(rect.x, rect.y, rect.width, rect.height)
    
    // 图标 - 调整位置和大小
    this.ctx.fillStyle = color
    this.ctx.font = '12px Arial'
    this.ctx.textAlign = 'left'
    this.ctx.fillText(icon, rect.x + 4, rect.y + 14)
    
    // 数值 - 调整位置避免遮挡
    this.ctx.fillStyle = '#FFFFFF'
    this.ctx.font = 'bold 13px Arial'
    this.ctx.fillText(value, rect.x + 4, rect.y + 28)
  }
  
  // 宽松的等级显示 - 更大更清晰
  renderLevelDisplay() {
    const rect = this.uiElements.levelDisplay
    const gameData = this.dataManager.gameData
    
    // 背景 - 魔法主题
    const gradient = this.ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.height)
    gradient.addColorStop(0, 'rgba(147, 112, 219, 0.8)')
    gradient.addColorStop(1, 'rgba(138, 43, 226, 0.9)')
    this.ctx.fillStyle = gradient
    this.ctx.fillRect(rect.x, rect.y, rect.width, rect.height)
    
    // 魔法边框
    this.ctx.strokeStyle = '#FFD700'
    this.ctx.lineWidth = 2
    this.ctx.strokeRect(rect.x, rect.y, rect.width, rect.height)
    
    // 等级 - 更大字体
    this.ctx.fillStyle = '#FFD700'
    this.ctx.font = 'bold 16px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText(`Lv.${gameData.level}`, rect.x + rect.width / 2, rect.y + 20)
    
    // 经验条 - 增大高度
    const expPercent = gameData.exp / gameData.expToNext
    const barWidth = rect.width - 12
    const barHeight = 6
    
    // 经验条背景
    this.ctx.fillStyle = '#333333'
    this.ctx.fillRect(rect.x + 6, rect.y + 25, barWidth, barHeight)
    
    // 经验条
    this.ctx.fillStyle = '#00FF00'
    this.ctx.fillRect(rect.x + 6, rect.y + 25, barWidth * expPercent, barHeight)
  }
  
  // 紧凑版库存显示 - 放大字体
  renderCompactInventoryDisplay() {
    const inventory = this.dataManager.getInventory()
    const rect = this.uiElements.inventoryTopDisplay
    
    // 背景 - 魔法主题
    const gradient = this.ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.height)
    gradient.addColorStop(0, 'rgba(139, 69, 19, 0.6)')
    gradient.addColorStop(1, 'rgba(101, 67, 33, 0.7)')
    this.ctx.fillStyle = gradient
    this.ctx.fillRect(rect.x, rect.y, rect.width, rect.height)
    
    // 魔法边框
    this.ctx.strokeStyle = '#FFD700'
    this.ctx.lineWidth = 1
    this.ctx.strokeRect(rect.x, rect.y, rect.width, rect.height)
    
    // 标题和库存项目 - 放大字体
    this.ctx.fillStyle = '#FFFFFF'
    this.ctx.font = '10px Arial'
    this.ctx.textAlign = 'left'
    this.ctx.fillText('📦库存:', rect.x + 2, rect.y + 12)
    
    const itemWidth = (rect.width - 35) / 3
    this.ctx.textAlign = 'center'
    this.ctx.font = 'bold 10px Arial'
    
    this.ctx.fillText(`🧪${inventory.potions}`, rect.x + 30 + itemWidth * 0.5, rect.y + 12)
    this.ctx.fillText(`✨${inventory.enchantments}`, rect.x + 30 + itemWidth * 1.5, rect.y + 12)
    this.ctx.fillText(`💎${inventory.crystals}`, rect.x + 30 + itemWidth * 2.5, rect.y + 12)
  }
  
  // 紧凑版状态显示 - 放大字体
  renderCompactStatusDisplay() {
    const gameData = this.dataManager.gameData
    const rect = this.uiElements.statusTopDisplay
    
    // 背景 - 魔法主题
    const gradient = this.ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.height)
    gradient.addColorStop(0, 'rgba(72, 61, 139, 0.6)')
    gradient.addColorStop(1, 'rgba(106, 90, 205, 0.7)')
    this.ctx.fillStyle = gradient
    this.ctx.fillRect(rect.x, rect.y, rect.width, rect.height)
    
    // 魔法边框
    this.ctx.strokeStyle = '#FFD700'
    this.ctx.lineWidth = 1
    this.ctx.strokeRect(rect.x, rect.y, rect.width, rect.height)
    
    // 状态信息 - 放大字体
    this.ctx.fillStyle = '#FFFFFF'
    this.ctx.font = '10px Arial'
    this.ctx.textAlign = 'left'
    this.ctx.fillText('📈状态:', rect.x + 2, rect.y + 12)
    
    const statusWidth = (rect.width - 30) / 2
    this.ctx.textAlign = 'center'
    this.ctx.font = 'bold 10px Arial'
    
    const happiness = Math.round(gameData.customerHappiness * 100)
    const efficiency = Math.round(gameData.productionEfficiency * 100)
    
    this.ctx.fillText(`😊${happiness}%`, rect.x + 25 + statusWidth * 0.5, rect.y + 12)
    this.ctx.fillText(`⚡${efficiency}%`, rect.x + 25 + statusWidth * 1.5, rect.y + 12)
  }
  
  // 居中显示库存不足提示 - 最高层级
  renderCenteredInsufficientStockNotice(message) {
    const noticeWidth = 280
    const noticeHeight = 100
    const x = (this.canvas.width - noticeWidth) / 2
    const y = (this.canvas.height - noticeHeight) / 2
    
    // 半透明背景遮罩
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    
    // 提示框背景 - 魔法主题
    const gradient = this.ctx.createLinearGradient(x, y, x, y + noticeHeight)
    gradient.addColorStop(0, '#8B4513')
    gradient.addColorStop(1, '#654321')
    this.ctx.fillStyle = gradient
    this.ctx.fillRect(x, y, noticeWidth, noticeHeight)
    
    // 提示框边框
    this.ctx.strokeStyle = '#FFD700'
    this.ctx.lineWidth = 3
    this.ctx.strokeRect(x, y, noticeWidth, noticeHeight)
    
    // 标题
    this.ctx.fillStyle = '#FF6B6B'
    this.ctx.font = 'bold 16px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('⚠️ 库存不足', x + noticeWidth / 2, y + 30)
    
    // 消息内容
    this.ctx.fillStyle = '#FFFFFF'
    this.ctx.font = '12px Arial'
    this.ctx.fillText(message, x + noticeWidth / 2, y + 55)
    
    // 关闭按钮
    const closeButtonSize = 30
    const closeX = x + noticeWidth - closeButtonSize - 10
    const closeY = y + 10
    
    this.ctx.fillStyle = '#FF4444'
    this.ctx.fillRect(closeX, closeY, closeButtonSize, closeButtonSize)
    this.ctx.strokeStyle = '#FFFFFF'
    this.ctx.lineWidth = 2
    this.ctx.strokeRect(closeX, closeY, closeButtonSize, closeButtonSize)
    this.ctx.fillStyle = '#FFFFFF'
    this.ctx.font = 'bold 14px Arial'
    this.ctx.fillText('✖', closeX + closeButtonSize / 2, closeY + closeButtonSize / 2 + 4)
    
    // 保存关闭按钮位置用于点击检测
    this.uiElements.insufficientStockCloseButton = {
      x: closeX,
      y: closeY,
      width: closeButtonSize,
      height: closeButtonSize
    }
  }
  
  // 开始屏幕
  renderStartScreen() {
    // 背景
    this.ctx.fillStyle = '#2C1810'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    
    // 标题
    this.ctx.fillStyle = '#FFD700'
    this.ctx.font = 'bold 32px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.strokeStyle = '#8B4513'
    this.ctx.lineWidth = 3
    this.ctx.strokeText('🏪 魔法商店', this.canvas.width / 2, this.canvas.height / 2 - 100)
    this.ctx.fillText('🏪 魔法商店', this.canvas.width / 2, this.canvas.height / 2 - 100)
    
    // 副标题
    this.ctx.fillStyle = '#FFFFFF'
    this.ctx.font = '16px Arial'
    this.ctx.fillText('经营你的魔法商店，服务魔法世界的顾客', this.canvas.width / 2, this.canvas.height / 2 - 60)
    
    // 开始按钮
    const startButton = this.uiElements.startButton
    this.renderButton(startButton, '🎮 开始游戏', '#4CAF50')
  }
  
  // 暂停覆盖层
  renderPauseOverlay() {
    // 半透明遮罩
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    
    // 暂停文字
    this.ctx.fillStyle = '#FFFFFF'
    this.ctx.font = 'bold 24px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('⏸️ 游戏暂停', this.canvas.width / 2, this.canvas.height / 2)
    
    // 恢复按钮
    const resumeButton = this.uiElements.resumeButton
    this.renderButton(resumeButton, '▶️ 继续游戏', '#4CAF50')
  }
  
  // 升级面板
  renderUpgradePanel() {
    const panelWidth = Math.min(350, this.canvas.width - 30) // 增加面板宽度
    const panelHeight = 480 // 增加面板高度
    const x = (this.canvas.width - panelWidth) / 2
    const y = (this.canvas.height - panelHeight) / 2
    
    // 半透明背景
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    
    // 面板背景
    this.ctx.fillStyle = '#2C1810'
    this.ctx.fillRect(x, y, panelWidth, panelHeight)
    this.ctx.strokeStyle = '#FFD700'
    this.ctx.lineWidth = 3
    this.ctx.strokeRect(x, y, panelWidth, panelHeight)
    
    // 标题
    this.ctx.fillStyle = '#FFD700'
    this.ctx.font = 'bold 20px Arial' // 增大标题字体
    this.ctx.textAlign = 'center'
    this.ctx.fillText('⬆️ 设施升级', x + panelWidth / 2, y + 35)
    
    // 升级选项
    const workshops = this.dataManager.getWorkshops()
    let currentY = y + 70 // 增加标题下方间距
    
    workshops.forEach((workshop, index) => {
      const upgradeRect = {
        x: x + 25, // 增加左右边距
        y: currentY,
        width: panelWidth - 50, // 增加内容宽度
        height: 80 // 增加项目高度
      }
      
      // 计算升级费用
      const goldCost = workshop.upgradeGoldCost || (workshop.level * 100)
      const gemCost = workshop.upgradeGemCost || 0
      const canAffordGold = this.dataManager.getGold() >= goldCost
      const canAffordGems = this.dataManager.getGems() >= gemCost
      const canUpgrade = canAffordGold && canAffordGems
      
      // 升级项背景 - 根据是否可升级使用不同颜色
      if (canUpgrade) {
        const gradient = this.ctx.createLinearGradient(upgradeRect.x, upgradeRect.y, upgradeRect.x, upgradeRect.y + upgradeRect.height)
        gradient.addColorStop(0, '#4CAF50')
        gradient.addColorStop(1, '#388E3C')
        this.ctx.fillStyle = gradient
      } else {
        this.ctx.fillStyle = '#757575'
      }
      this.ctx.fillRect(upgradeRect.x, upgradeRect.y, upgradeRect.width, upgradeRect.height)
      
      // 升级项边框
      this.ctx.strokeStyle = canUpgrade ? '#FFD700' : '#AAAAAA'
      this.ctx.lineWidth = 2
      this.ctx.strokeRect(upgradeRect.x, upgradeRect.y, upgradeRect.width, upgradeRect.height)
      
      // 设施名称 - 更大字体和更好间距
      this.ctx.fillStyle = '#FFFFFF'
      this.ctx.font = 'bold 16px Arial' // 增大字体
      this.ctx.textAlign = 'left'
      this.ctx.fillText(`${workshop.name} (Lv.${workshop.level})`, upgradeRect.x + 15, upgradeRect.y + 25)
      
      // 升级效果描述（如果有的话）
      this.ctx.fillStyle = '#E0E0E0'
      this.ctx.font = '12px Arial'
      const effectDesc = this.getUpgradeEffectDescription(workshop)
      if (effectDesc) {
        this.ctx.fillText(effectDesc, upgradeRect.x + 15, upgradeRect.y + 45)
      }
      
      // 升级费用显示 - 更好的布局
      this.ctx.font = '14px Arial' // 增大费用字体
      
      // 金币费用
      this.ctx.fillStyle = canAffordGold ? '#FFD700' : '#FF6B6B'
      this.ctx.fillText(`💰 ${this.formatNumber(goldCost)} 金币`, upgradeRect.x + 15, upgradeRect.y + 65)
      
      // 宝石费用（如果需要）
      if (gemCost > 0) {
        this.ctx.fillStyle = canAffordGems ? '#FF69B4' : '#FF6B6B'
        this.ctx.fillText(`💎 ${gemCost} 宝石`, upgradeRect.x + 170, upgradeRect.y + 65)
      }
      
      // 保存升级按钮位置
      this.uiElements[`upgradeWorkshop${index}`] = upgradeRect
      
      currentY += 95 // 增加项目间距
    })
    
    // 关闭按钮 - 增大尺寸
    const closeButton = {
      x: x + panelWidth - 45,
      y: y + 10,
      width: 35,
      height: 35
    }
    this.renderButton(closeButton, '✖', '#FF4444')
    this.uiElements.closeUpgradePanel = closeButton
  }
  
  // 获取升级效果描述
  getUpgradeEffectDescription(workshop) {
    const nextLevel = workshop.level + 1
    switch (workshop.type) {
      case 'potion':
        return `生产速度提升至 ${nextLevel * 0.5}/秒`
      case 'enchantment':
        return `生产速度提升至 ${nextLevel * 0.3}/秒`
      case 'crystal':
        return `生产速度提升至 ${nextLevel * 0.2}/秒`
      default:
        return `效率提升 ${nextLevel * 10}%`
    }
  }
  
  // 统计面板
  renderStatsPanel() {
    const panelWidth = Math.min(320, this.canvas.width - 40)
    const panelHeight = 450
    const x = (this.canvas.width - panelWidth) / 2
    const y = (this.canvas.height - panelHeight) / 2
    
    // 半透明背景
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    
    // 面板背景
    this.ctx.fillStyle = '#2C1810'
    this.ctx.fillRect(x, y, panelWidth, panelHeight)
    this.ctx.strokeStyle = '#FFD700'
    this.ctx.lineWidth = 3
    this.ctx.strokeRect(x, y, panelWidth, panelHeight)
    
    // 标题
    this.ctx.fillStyle = '#FFD700'
    this.ctx.font = 'bold 18px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('📊 游戏统计', x + panelWidth / 2, y + 30)
    
    // 获取真实的统计数据
    const stats = this.dataManager.getStats()
    const gameData = this.dataManager.gameData
    const inventory = this.dataManager.getInventory()
    
    // 统计信息分类显示
    this.ctx.fillStyle = '#FFFFFF'
    this.ctx.font = '14px Arial'
    this.ctx.textAlign = 'left'
    
    let currentY = y + 70
    
    // 基本信息
    this.ctx.fillStyle = '#FFD700'
    this.ctx.font = 'bold 16px Arial'
    this.ctx.fillText('基本信息:', x + 20, currentY)
    currentY += 25
    
    this.ctx.fillStyle = '#FFFFFF'
    this.ctx.font = '14px Arial'
    this.ctx.fillText(`当前等级: Lv.${gameData.level}`, x + 30, currentY)
    currentY += 20
    this.ctx.fillText(`经验值: ${gameData.exp}/${gameData.expToNext}`, x + 30, currentY)
    currentY += 20
    this.ctx.fillText(`当前金币: ${this.formatNumber(gameData.gold)}`, x + 30, currentY)
    currentY += 20
    this.ctx.fillText(`当前宝石: ${gameData.gems}`, x + 30, currentY)
    currentY += 30
    
    // 销售统计
    this.ctx.fillStyle = '#FFD700'
    this.ctx.font = 'bold 16px Arial'
    this.ctx.fillText('销售统计:', x + 20, currentY)
    currentY += 25
    
    this.ctx.fillStyle = '#FFFFFF'
    this.ctx.font = '14px Arial'
    this.ctx.fillText(`总收入: ${this.formatNumber(stats.totalGoldEarned)}`, x + 30, currentY)
    currentY += 20
    this.ctx.fillText(`售出物品: ${stats.totalItemsSold}件`, x + 30, currentY)
    currentY += 20
    this.ctx.fillText(`服务顾客: ${stats.totalCustomersServed}人`, x + 30, currentY)
    currentY += 30
    
    // 库存状态
    this.ctx.fillStyle = '#FFD700'
    this.ctx.font = 'bold 16px Arial'
    this.ctx.fillText('当前库存:', x + 20, currentY)
    currentY += 25
    
    this.ctx.fillStyle = '#FFFFFF'
    this.ctx.font = '14px Arial'
    this.ctx.fillText(`🧪 魔法药水: ${inventory.potions}`, x + 30, currentY)
    currentY += 20
    this.ctx.fillText(`✨ 附魔物品: ${inventory.enchantments}`, x + 30, currentY)
    currentY += 20
    this.ctx.fillText(`💎 魔法水晶: ${inventory.crystals}`, x + 30, currentY)
    currentY += 30
    
    // 游戏状态
    this.ctx.fillStyle = '#FFD700'
    this.ctx.font = 'bold 16px Arial'
    this.ctx.fillText('状态指标:', x + 20, currentY)
    currentY += 25
    
    this.ctx.fillStyle = '#FFFFFF'
    this.ctx.font = '14px Arial'
    const happiness = Math.round((gameData.customerHappiness || 1.0) * 100)
    const efficiency = Math.round((gameData.productionEfficiency || 1.0) * 100)
    this.ctx.fillText(`😊 顾客满意度: ${happiness}%`, x + 30, currentY)
    currentY += 20
    this.ctx.fillText(`⚡ 生产效率: ${efficiency}%`, x + 30, currentY)
    
    // 关闭按钮
    const closeButton = {
      x: x + panelWidth - 40,
      y: y + 10,
      width: 30,
      height: 30
    }
    this.renderButton(closeButton, '✖', '#FF4444')
    this.uiElements.closeStatsPanel = closeButton
  }
  
  // 通知渲染
  renderNotifications() {
    // 这里可以添加各种游戏通知的渲染逻辑
  }
  
  // 动画更新
  updateAnimations() {
    // 这里可以添加UI动画的更新逻辑
  }
  
  // 计算UI元素位置 - 单行布局，状态栏和按钮保持一行
  calculateUIElements() {
    const { topBarHeight, bottomBarHeight, padding } = this.uiConfig
    const fixedTopMargin = 88
    
    // 顶部资源显示 - 单行宽松布局，更大尺寸
    const resourceWidth = 85  // 稍微缩小以为按钮腾出空间
    const resourceHeight = 32 // 增大高度
    const levelWidth = 75     // 稍微缩小等级显示宽度
    
    // 单行布局：金币、宝石、等级
    this.uiElements.goldDisplay = {
      x: padding,
      y: fixedTopMargin,
      width: resourceWidth,
      height: resourceHeight
    }
    
    this.uiElements.gemsDisplay = {
      x: padding + resourceWidth + 8,  // 稍微减小间距
      y: fixedTopMargin,
      width: resourceWidth,
      height: resourceHeight
    }
    
    this.uiElements.levelDisplay = {
      x: padding + (resourceWidth + 8) * 2,
      y: fixedTopMargin,
      width: levelWidth,
      height: resourceHeight
    }
    
    // 右上角按钮 - 与状态栏保持同一行
    const smallButtonSize = 30 // 稍微缩小按钮
    const buttonSpacing = 6
    
    this.uiElements.menuButton = {
      x: this.canvas.width - padding - smallButtonSize,
      y: fixedTopMargin, // 与资源显示保持同一行
      width: smallButtonSize,
      height: smallButtonSize
    }
    
    this.uiElements.pauseButton = {
      x: this.canvas.width - padding - (smallButtonSize + buttonSpacing) * 2,
      y: fixedTopMargin, // 与资源显示保持同一行
      width: smallButtonSize,
      height: smallButtonSize
    }
    
    // 底部按钮布局
    const buttonWidth = 80
    const buttonHeight = 40
    const buttonY = this.canvas.height - bottomBarHeight + 20
    
    this.uiElements.upgradeButton = {
      x: padding,
      y: buttonY,
      width: buttonWidth,
      height: buttonHeight
    }
    
    this.uiElements.statsButton = {
      x: padding,
      y: buttonY,
      width: buttonWidth,
      height: buttonHeight
    }
    
    this.uiElements.workshopButton = {
      x: padding + buttonWidth + 10,
      y: buttonY,
      width: buttonWidth,
      height: buttonHeight
    }
    
    this.uiElements.autoSellButton = {
      x: padding + (buttonWidth + 10) * 2,
      y: buttonY,
      width: buttonWidth,
      height: buttonHeight
    }
    
    this.uiElements.collapseButton = {
      x: this.canvas.width - padding - 40,
      y: buttonY,
      width: 35,
      height: buttonHeight
    }
    
    // 收缩状态下的展开按钮
    this.uiElements.expandButton = {
      x: this.canvas.width / 2 - 20,
      y: this.canvas.height - 35,
      width: 40,
      height: 30
    }
    
    // 开始屏幕按钮
    this.uiElements.startButton = {
      x: this.canvas.width / 2 - 80,
      y: this.canvas.height / 2 + 20,
      width: 160,
      height: 50
    }
    
    // 暂停屏幕按钮
    this.uiElements.resumeButton = {
      x: this.canvas.width / 2 - 80,
      y: this.canvas.height / 2 + 40,
      width: 160,
      height: 50
    }
  }
  
  // 屏幕适配调整
  adjustUIForScreen() {
    // 根据屏幕尺寸调整UI元素
    if (this.canvas.width < 400) {
      // 小屏幕适配
      this.uiConfig.padding = 8
      this.uiConfig.buttonMinSize = 40
    }
  }
  
  // 设备信息获取
  getDeviceInfo() {
    // 安全获取screen信息，兼容微信小程序环境
    const screen = window.screen || {}
    const screenWidth = screen.width || this.canvas.width || 375
    const screenHeight = screen.height || this.canvas.height || 667
    
    return {
      pixelRatio: window.devicePixelRatio || 1,
      screenWidth: screenWidth,
      screenHeight: screenHeight,
      isIOS: typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent),
      isAndroid: typeof navigator !== 'undefined' && /Android/.test(navigator.userAgent)
    }
  }
  
  // 安全区域计算
  calculateSafeArea() {
    const info = this.deviceInfo
    let safeTop = 20 // 默认状态栏高度
    
    // iOS设备安全区域适配
    if (info.isIOS) {
      // iPhone X及以上机型 - 使用安全的screenHeight获取
      if (info.screenHeight >= 812) {
        safeTop = 44
      }
    }
    
    return {
      top: safeTop,
      bottom: 34, // 默认底部安全区域
      left: 0,
      right: 0
    }
  }
  
  // 触摸事件处理
  handleTouch(x, y) {
    console.log('UIManager.handleTouch called with:', x, y)
    console.log('Current UI state:', {
      showingStartScreen: this.showingStartScreen,
      showingInsufficientStockNotice: this.showingInsufficientStockNotice,
      showingWorkshopDetailPanel: this.showingWorkshopDetailPanel,
      gamePaused: this.gamePaused
    })
    
    // 检查库存不足提示关闭按钮
    if (this.showingInsufficientStockNotice && this.uiElements.insufficientStockCloseButton) {
      if (this.isPointInRect(x, y, this.uiElements.insufficientStockCloseButton)) {
        this.showingInsufficientStockNotice = false
        return true
      }
    }
    
    // 如果显示开始屏幕
    if (this.showingStartScreen) {
      console.log('Start screen is showing, checking start button')
      console.log('Start button rect:', this.uiElements.startButton)
      console.log('Click point:', x, y)
      
      if (this.isPointInRect(x, y, this.uiElements.startButton)) {
        console.log('Start button clicked!')
        this.startGame()
        return true
      } else {
        console.log('Click missed start button')
      }
      return false
    }
    
    // 如果游戏暂停
    if (this.gamePaused) {
      if (this.isPointInRect(x, y, this.uiElements.resumeButton)) {
        this.resumeGame()
        return true
      }
      return false
    }
    
    // 面板相关触摸处理
    if (this.showingUpgradePanel) {
      return this.handleUpgradePanelTouch(x, y)
    }
    
    if (this.showingStatsPanel) {
      return this.handleStatsPanelTouch(x, y)
    }
    
    // 工作台详情面板触摸处理
    if (this.showingWorkshopDetailPanel) {
      return this.handleWorkshopDetailPanelTouch(x, y)
    }
    
    // 主界面触摸处理
    return this.handleMainUITouch(x, y)
  }
  
  // 主界面触摸处理
  handleMainUITouch(x, y) {
    console.log('handleMainUITouch called with:', x, y)
    
    // 右上角按钮
    if (this.isPointInRect(x, y, this.uiElements.pauseButton)) {
      console.log('Pause button clicked')
      this.togglePause()
      return true
    }
    
    if (this.isPointInRect(x, y, this.uiElements.menuButton)) {
      console.log('Menu button clicked')
      this.showGameMenu()
      return true
    }
    
    // 底部按钮处理
    if (this.bottomBarCollapsed) {
      if (this.isPointInRect(x, y, this.uiElements.expandButton)) {
        console.log('Expand button clicked')
        this.bottomBarCollapsed = false
        return true
      }
    } else {
      if (this.isPointInRect(x, y, this.uiElements.statsButton)) {
        console.log('Stats button clicked')
        this.showStatsPanel()
        return true
      }
      
      if (this.isPointInRect(x, y, this.uiElements.workshopButton)) {
        console.log('Workshop button clicked')
        this.showWorkshopDetailPanel()
        return true
      }
      
      if (this.isPointInRect(x, y, this.uiElements.autoSellButton)) {
        console.log('Auto sell button clicked!')
        console.log('Auto sell button rect:', this.uiElements.autoSellButton)
        this.toggleAutoSell()
        return true
      }
      
      if (this.isPointInRect(x, y, this.uiElements.collapseButton)) {
        console.log('Collapse button clicked')
        this.bottomBarCollapsed = true
        return true
      }
    }
    
    return false
  }
  
  // 升级面板触摸处理
  handleUpgradePanelTouch(x, y) {
    if (this.isPointInRect(x, y, this.uiElements.closeUpgradePanel)) {
      this.hideUpgradePanel()
      return true
    }
    
    // 检查升级按钮
    const workshops = this.dataManager.getWorkshops()
    for (let i = 0; i < workshops.length; i++) {
      const upgradeRect = this.uiElements[`upgradeWorkshop${i}`]
      if (upgradeRect && this.isPointInRect(x, y, upgradeRect)) {
        this.gameManager.upgradeWorkshop(i)
        return true
      }
    }
    
    return true // 阻止点击穿透
  }
  
  // 统计面板触摸处理
  handleStatsPanelTouch(x, y) {
    if (this.isPointInRect(x, y, this.uiElements.closeStatsPanel)) {
      this.hideStatsPanel()
      return true
    }
    
    return true // 阻止点击穿透
  }
  
  // 工作台详情面板触摸处理
  handleWorkshopDetailPanelTouch(x, y) {
    console.log('Workshop detail panel touch:', x, y)
    
    // 检查关闭按钮
    if (this.isPointInRect(x, y, this.uiElements.closeWorkshopDetailPanel)) {
      console.log('Closing workshop detail panel')
      this.hideWorkshopDetailPanel()
      return true
    }
    
    // 检查所有工作台的操作按钮（包括未建造的）
    const allWorkshops = this.dataManager.getWorkshops()
    
    for (let i = 0; i < allWorkshops.length; i++) {
      const workshop = allWorkshops[i]
      
      // 检查操作按钮（开始/收集/建造）
      const actionButton = this.uiElements[`workshopAction${i}`]
      if (actionButton && this.isPointInRect(x, y, actionButton)) {
        console.log(`Workshop action button ${i} clicked`)
        this.handleWorkshopAction(workshop, i)
        // 添加触觉反馈
        this.createButtonFeedback(actionButton)
        return true
      }
      
      // 仅对已建造的工作台检查升级和加速按钮
      if (workshop.unlocked) {
        // 检查升级按钮
        const upgradeButton = this.uiElements[`workshopUpgrade${i}`]
        if (upgradeButton && this.isPointInRect(x, y, upgradeButton)) {
          console.log(`Workshop upgrade button ${i} clicked`)
          this.handleWorkshopUpgrade(workshop, i)
          // 添加触觉反馈
          this.createButtonFeedback(upgradeButton)
          return true
        }
        
        // 检查加速按钮（仅在生产中显示）
        if (workshop.producing) {
          const speedupButton = this.uiElements[`workshopSpeedup${i}`]
          if (speedupButton && this.isPointInRect(x, y, speedupButton)) {
            console.log(`Workshop speedup button ${i} clicked`)
            this.handleWorkshopSpeedup(workshop, i)
            // 添加触觉反馈
            this.createButtonFeedback(speedupButton)
            return true
          }
        }
      }
    }
    
    return true // 阻止点击穿透
  }
  
  // 处理工作台操作（开始/收集/建造）
  handleWorkshopAction(workshop, index) {
    if (!workshop.unlocked) {
      // 未建造工作台 - 执行建造操作
      this.handleWorkshopBuild(workshop, index)
      return
    }
    
    if (workshop.producing) {
      // 检查是否可以收集
      const currentTime = Date.now()
      const productionTime = currentTime - workshop.productionStartTime
      const canCollect = productionTime >= workshop.productionDuration
      
      if (canCollect) {
        // 收集产品
        this.gameManager.completeProduction(workshop)
        console.log(`收集了 ${workshop.name} 的产品`)
      } else {
        console.log(`${workshop.name} 还在生产中，无法收集`)
      }
    } else {
      // 开始生产
      workshop.producing = true
      workshop.productionStartTime = Date.now()
      this.dataManager.markDirty()
      console.log(`开始 ${workshop.name} 的生产`)
    }
  }
  
  // 处理工作台建造
  handleWorkshopBuild(workshop, index) {
    // 检查等级要求
    const requiredLevel = this.dataManager.getRequiredLevel ? this.dataManager.getRequiredLevel(workshop.id) : 1
    const currentLevel = this.dataManager.gameData.level
    
    if (currentLevel < requiredLevel) {
      console.log(`建造 ${workshop.name} 需要等级 ${requiredLevel}`)
      this.gameManager.createFloatingText(`需要等级 ${requiredLevel}`, this.canvas.width / 2, this.canvas.height / 2, '#FF0000')
      return
    }
    
    // 计算建造费用
    const buildCost = this.getWorkshopBuildCost(workshop.id)
    
    if (this.dataManager.getGold() < buildCost.gold || this.dataManager.getGems() < buildCost.gems) {
      console.log(`建造 ${workshop.name} 资源不足`)
      let message = '建造失败: '
      if (this.dataManager.getGold() < buildCost.gold) {
        message += `需要 ${buildCost.gold} 金币 `
      }
      if (this.dataManager.getGems() < buildCost.gems) {
        message += `需要 ${buildCost.gems} 宝石`
      }
      this.gameManager.createFloatingText(message, this.canvas.width / 2, this.canvas.height / 2, '#FF0000')
      return
    }
    
    // 扣除建造费用
    this.dataManager.spendGold(buildCost.gold)
    if (buildCost.gems > 0) {
      this.dataManager.spendGems(buildCost.gems)
    }
    
    // 建造工作台
    workshop.unlocked = true
    workshop.level = 1
    
    // 更新工作台属性
    this.gameManager.updateWorkshopStats(workshop)
    
    // 增加经验
    this.dataManager.addExp(20)
    
    // 创建建造特效
    this.gameManager.createFloatingText(`${workshop.name} 建造完成!`, this.canvas.width / 2, this.canvas.height / 2, '#00FF00', 18)
    
    // 保存数据
    this.dataManager.markDirty()
    
    console.log(`成功建造 ${workshop.name}`)
  }
  
  // 获取工作台建造费用
  getWorkshopBuildCost(workshopId) {
    const costs = {
      'potion_lab': { gold: 0, gems: 0 },      // 药水实验室免费，默认解锁
      'enchant_table': { gold: 500, gems: 1 }, // 附魔台
      'crystal_forge': { gold: 2000, gems: 3 } // 水晶熔炉
    }
    return costs[workshopId] || { gold: 100, gems: 0 }
  }
  
  // 处理工作台升级
  handleWorkshopUpgrade(workshop, index) {
    const originalIndex = this.dataManager.getWorkshops().indexOf(workshop)
    const success = this.gameManager.upgradeWorkshop(originalIndex)
    if (success) {
      console.log(`成功升级 ${workshop.name}`)
    } else {
      console.log(`升级 ${workshop.name} 失败`)
    }
  }
  
  // 处理工作台加速
  handleWorkshopSpeedup(workshop, index) {
    // 检查微信API是否可用
    if (typeof wx !== 'undefined' && wx.showModal) {
      wx.showModal({
        title: '加速生产',
        content: `观看广告可以立即完成 ${workshop.name} 的生产，是否继续？`,
        confirmText: '观看广告',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            this.adManager.showSpeedUpAd((success) => {
              if (success) {
                this.gameManager.completeProduction(workshop)
                console.log(`加速完成了 ${workshop.name} 的生产`)
              }
            })
          }
        }
      })
    } else {
      // fallback: 直接完成生产
      console.log('微信API不可用，直接完成生产')
      this.gameManager.completeProduction(workshop)
    }
  }
  
  // 创建按钮反馈效果
  createButtonFeedback(buttonRect) {
    // 创建短暂的高亮效果
    const originalTime = Date.now()
    
    // 移除震动反馈，使用轻型烟花效果替代
    this.gameManager.createFireworkEffect(
      buttonRect.x + buttonRect.width / 2,
      buttonRect.y + buttonRect.height / 2,
      '#FFD700'
    )
    
    // 创建视觉反馈 - 在按钮位置显示短暂的闪光效果
    setTimeout(() => {
      // 这里可以添加视觉反馈逻辑
      console.log('Button feedback effect')
    }, 50)
  }
  
  // 游戏控制方法
  startGame() {
    this.showingStartScreen = false
    this.gameManager.startGame()
  }
  
  togglePause() {
    this.gamePaused = !this.gamePaused
    if (this.gamePaused) {
      this.gameManager.pauseGame()
    } else {
      this.gameManager.resumeGame()
    }
  }
  
  resumeGame() {
    this.gamePaused = false
    this.gameManager.resumeGame()
  }
  
  showUpgradePanel() {
    this.showingUpgradePanel = true
  }
  
  hideUpgradePanel() {
    this.showingUpgradePanel = false
  }
  
  showStatsPanel() {
    this.showingStatsPanel = true
  }
  
  hideStatsPanel() {
    this.showingStatsPanel = false
  }
  
  showWorkshopDetailPanel() {
    this.showingWorkshopDetailPanel = true
  }
  
  hideWorkshopDetailPanel() {
    this.showingWorkshopDetailPanel = false
  }
  
  // 渲染工作台详情面板
  renderWorkshopDetailPanel() {
    const panelWidth = Math.min(370, this.canvas.width - 30)
    const panelHeight = 600 // 增加面板高度以容纳更多工作台
    const x = (this.canvas.width - panelWidth) / 2
    const y = (this.canvas.height - panelHeight) / 2
    
    // 半透明背景
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    
    // 面板背景
    this.ctx.fillStyle = '#2C1810'
    this.ctx.fillRect(x, y, panelWidth, panelHeight)
    this.ctx.strokeStyle = '#FFD700'
    this.ctx.lineWidth = 3
    this.ctx.strokeRect(x, y, panelWidth, panelHeight)
    
    // 标题
    this.ctx.fillStyle = '#FFD700'
    this.ctx.font = 'bold 20px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('🏭 工作台管理', x + panelWidth / 2, y + 35)
    
    // 获取所有工作台（包括未建造的）
    const allWorkshops = this.dataManager.getWorkshops()
    let currentY = y + 70
    
    allWorkshops.forEach((workshop, index) => {
      const workshopRect = {
        x: x + 20,
        y: currentY,
        width: panelWidth - 40,
        height: 100
      }
      
      // 工作台背景 - 根据建造状态和生产状态使用不同颜色
      const gradient = this.ctx.createLinearGradient(workshopRect.x, workshopRect.y, workshopRect.x, workshopRect.y + workshopRect.height)
      
      if (!workshop.unlocked) {
        // 未建造工作台 - 使用暗灰色
        gradient.addColorStop(0, '#424242')
        gradient.addColorStop(1, '#212121')
      } else if (workshop.producing) {
        // 生产中工作台 - 使用绿色
        gradient.addColorStop(0, '#4CAF50')
        gradient.addColorStop(1, '#388E3C')
      } else {
        // 空闲工作台 - 使用普通灰色
        gradient.addColorStop(0, '#616161')
        gradient.addColorStop(1, '#424242')
      }
      
      this.ctx.fillStyle = gradient
      this.ctx.fillRect(workshopRect.x, workshopRect.y, workshopRect.width, workshopRect.height)
      
      // 工作台边框 - 根据建造状态使用不同颜色
      this.ctx.strokeStyle = workshop.unlocked ? '#FFD700' : '#666666'
      this.ctx.lineWidth = 2
      this.ctx.strokeRect(workshopRect.x, workshopRect.y, workshopRect.width, workshopRect.height)
      
      // 工作台图标区域
      const iconSize = 40
      const iconX = workshopRect.x + 10
      const iconY = workshopRect.y + 10
      
      // 绘制工作台图标（使用实际图片）
      let iconKey = 'potionLab'
      let iconColor = '#8B4513'
      let iconText = '药水'
      
      switch(workshop.id) {
        case 'potion_lab':
          iconKey = 'potionLab'
          iconColor = '#8B4513'
          iconText = '药水'
          break
        case 'enchant_table':
          iconKey = 'enchantTable'
          iconColor = '#9C27B0'
          iconText = '附魔'
          break
        case 'crystal_forge':
          iconKey = 'crystalForge'
          iconColor = '#FF5722'
          iconText = '水晶'
          break
      }
      
      // 使用GameManager的drawImage方法来绘制图标
      const imageDrawn = this.gameManager.drawImage(iconKey, iconX, iconY, iconSize, iconSize, iconColor, iconText)
      
      // 如果图片绘制失败，添加边框
      if (!imageDrawn) {
        this.ctx.strokeStyle = '#FFFFFF'
        this.ctx.lineWidth = 2
        this.ctx.strokeRect(iconX, iconY, iconSize, iconSize)
      }
      
      // 工作台名称和等级 - 根据建造状态显示不同颜色
      this.ctx.fillStyle = workshop.unlocked ? '#FFFFFF' : '#AAAAAA'
      this.ctx.font = 'bold 16px Arial'
      this.ctx.textAlign = 'left'
      this.ctx.fillText(`${workshop.name} Lv.${workshop.level}`, iconX + iconSize + 10, iconY + 20)
      
      // 生产状态或建造状态
      this.ctx.font = '12px Arial'
      if (!workshop.unlocked) {
        // 未建造工作台
        this.ctx.fillStyle = '#FF9800'
        this.ctx.fillText('未建造', iconX + iconSize + 10, iconY + 40)
        
        // 显示解锁要求
        const requiredLevel = this.dataManager.getRequiredLevel ? this.dataManager.getRequiredLevel(workshop.id) : 1
        this.ctx.fillStyle = '#CCCCCC'
        this.ctx.font = '11px Arial'
        this.ctx.fillText(`需要等级: ${requiredLevel}`, iconX + iconSize + 10, iconY + 55)
      } else if (workshop.producing) {
        const currentTime = Date.now()
        const productionTime = currentTime - workshop.productionStartTime
        const progress = Math.min(1, productionTime / workshop.productionDuration)
        const remaining = Math.max(0, workshop.productionDuration - productionTime)
        
        this.ctx.fillStyle = '#00FF00'
        this.ctx.fillText(`生产中... ${Math.ceil(remaining / 1000)}秒`, iconX + iconSize + 10, iconY + 40)
        
        // 进度条
        const progressBarWidth = 150
        const progressBarHeight = 6
        const progressBarX = iconX + iconSize + 10
        const progressBarY = iconY + 45
        
        // 进度条背景
        this.ctx.fillStyle = '#333333'
        this.ctx.fillRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight)
        
        // 进度条填充
        this.ctx.fillStyle = '#00FF00'
        this.ctx.fillRect(progressBarX, progressBarY, progressBarWidth * progress, progressBarHeight)
      } else {
        this.ctx.fillStyle = '#FFFF00'
        this.ctx.fillText('空闲中 - 点击开始生产', iconX + iconSize + 10, iconY + 40)
      }
      
      // 工作台统计信息 - 仅对已建造的工作台显示
      if (workshop.unlocked) {
        this.ctx.fillStyle = '#E0E0E0'
        this.ctx.font = '11px Arial'
        this.ctx.fillText(`收益: ${this.gameManager.calculateIncome(workshop)}/次`, iconX + iconSize + 10, workshopRect.y + workshopRect.height - 45)
        this.ctx.fillText(`耗时: ${workshop.productionDuration / 1000}秒`, iconX + iconSize + 10, workshopRect.y + workshopRect.height - 10)
      }
      
      // 操作按钮区域 - 根据工作台状态显示不同按钮
      const buttonWidth = 60
      const buttonHeight = 25
      const buttonX = workshopRect.x + workshopRect.width - buttonWidth - 10
      
      if (!workshop.unlocked) {
        // 未建造工作台 - 显示建造按钮
        const buildButtonY = workshopRect.y + 30
        const buildButton = {
          x: buttonX,
          y: buildButtonY,
          width: buttonWidth,
          height: buttonHeight
        }
        
        // 检查是否可以建造（等级要求）
        const requiredLevel = this.dataManager.getRequiredLevel ? this.dataManager.getRequiredLevel(workshop.id) : 1
        const currentLevel = this.dataManager.gameData.level
        const canBuild = currentLevel >= requiredLevel
        
        this.ctx.fillStyle = canBuild ? '#4CAF50' : '#757575'
        this.ctx.fillRect(buildButton.x, buildButton.y, buildButton.width, buildButton.height)
        this.ctx.strokeStyle = '#FFFFFF'
        this.ctx.lineWidth = 1
        this.ctx.strokeRect(buildButton.x, buildButton.y, buildButton.width, buildButton.height)
        
        this.ctx.fillStyle = '#FFFFFF'
        this.ctx.font = '10px Arial'
        this.ctx.textAlign = 'center'
        this.ctx.fillText(canBuild ? '建造' : '锁定', buildButton.x + buildButton.width / 2, buildButton.y + buildButton.height / 2 + 3)
        
        // 保存按钮位置用于点击检测
        this.uiElements[`workshopAction${index}`] = buildButton
      } else {
        // 已建造工作台 - 显示正常的操作按钮
        
        // 收集/开始按钮
        const actionButtonY = workshopRect.y + 15
        const actionButton = {
          x: buttonX,
          y: actionButtonY,
          width: buttonWidth,
          height: buttonHeight
        }
        
        if (workshop.producing) {
          const currentTime = Date.now()
          const productionTime = currentTime - workshop.productionStartTime
          const canCollect = productionTime >= workshop.productionDuration
          
          this.ctx.fillStyle = canCollect ? '#4CAF50' : '#757575'
          this.ctx.fillRect(actionButton.x, actionButton.y, actionButton.width, actionButton.height)
          this.ctx.strokeStyle = '#FFFFFF'
          this.ctx.lineWidth = 1
          this.ctx.strokeRect(actionButton.x, actionButton.y, actionButton.width, actionButton.height)
          
          this.ctx.fillStyle = '#FFFFFF'
          this.ctx.font = '10px Arial'
          this.ctx.textAlign = 'center'
          this.ctx.fillText(canCollect ? '收集' : '生产中', actionButton.x + actionButton.width / 2, actionButton.y + actionButton.height / 2 + 3)
        } else {
          this.ctx.fillStyle = '#2196F3'
          this.ctx.fillRect(actionButton.x, actionButton.y, actionButton.width, actionButton.height)
          this.ctx.strokeStyle = '#FFFFFF'
          this.ctx.lineWidth = 1
          this.ctx.strokeRect(actionButton.x, actionButton.y, actionButton.width, actionButton.height)
          
          this.ctx.fillStyle = '#FFFFFF'
          this.ctx.font = '10px Arial'
          this.ctx.textAlign = 'center'
          this.ctx.fillText('开始', actionButton.x + actionButton.width / 2, actionButton.y + actionButton.height / 2 + 3)
        }
        
        // 升级按钮
        const upgradeButtonY = workshopRect.y + 45
        const upgradeButton = {
          x: buttonX,
          y: upgradeButtonY,
          width: buttonWidth,
          height: buttonHeight
        }
        
        const goldCost = workshop.upgradeGoldCost || (workshop.level * 100)
        const gemCost = workshop.upgradeGemCost || 0
        const canAfford = this.dataManager.getGold() >= goldCost && this.dataManager.getGems() >= gemCost
        
        this.ctx.fillStyle = canAfford ? '#FF9800' : '#757575'
        this.ctx.fillRect(upgradeButton.x, upgradeButton.y, upgradeButton.width, upgradeButton.height)
        this.ctx.strokeStyle = '#FFFFFF'
        this.ctx.lineWidth = 1
        this.ctx.strokeRect(upgradeButton.x, upgradeButton.y, upgradeButton.width, upgradeButton.height)
        
        this.ctx.fillStyle = '#FFFFFF'
        this.ctx.font = '10px Arial'
        this.ctx.textAlign = 'center'
        this.ctx.fillText('升级', upgradeButton.x + upgradeButton.width / 2, upgradeButton.y + upgradeButton.height / 2 + 3)
        
        // 加速按钮（仅在生产中显示）
        if (workshop.producing) {
          const speedupButtonY = workshopRect.y + 75
          const speedupButton = {
            x: buttonX,
            y: speedupButtonY,
            width: buttonWidth,
            height: buttonHeight
          }
          
          this.ctx.fillStyle = '#9C27B0'
          this.ctx.fillRect(speedupButton.x, speedupButton.y, speedupButton.width, speedupButton.height)
          this.ctx.strokeStyle = '#FFFFFF'
          this.ctx.lineWidth = 1
          this.ctx.strokeRect(speedupButton.x, speedupButton.y, speedupButton.width, speedupButton.height)
          
          this.ctx.fillStyle = '#FFFFFF'
          this.ctx.font = '10px Arial'
          this.ctx.textAlign = 'center'
          this.ctx.fillText('加速', speedupButton.x + speedupButton.width / 2, speedupButton.y + speedupButton.height / 2 + 3)
          
          // 保存按钮位置
          this.uiElements[`workshopSpeedup${index}`] = speedupButton
        }
        
        // 保存按钮位置用于点击检测
        this.uiElements[`workshopAction${index}`] = actionButton
        this.uiElements[`workshopUpgrade${index}`] = upgradeButton
      }
      
      currentY += 110
    })
    
    // 关闭按钮
    const closeButton = {
      x: x + panelWidth - 40,
      y: y + 10,
      width: 30,
      height: 30
    }
    this.renderButton(closeButton, '✖', '#FF4444')
    this.uiElements.closeWorkshopDetailPanel = closeButton
  }
  
  showGameMenu() {
    // 显示设置菜单 - 新增游戏说明选项
    if (typeof wx !== 'undefined' && wx.showActionSheet) {
      wx.showActionSheet({
        itemList: ['游戏说明', '重新开始游戏'],
        success: (res) => {
          if (res.tapIndex === 0) {
            // 显示游戏说明
            this.showGameInstructions()
          } else if (res.tapIndex === 1) {
            // 重新开始游戏确认
            this.confirmResetGame()
          }
        }
      })
    } else {
      // fallback: 使用浏览器提示
      const choice = prompt('请选择操作：\n1 - 游戏说明\n2 - 重新开始游戏\n请输入数字：')
      if (choice === '1') {
        this.showGameInstructions()
      } else if (choice === '2') {
        this.confirmResetGame()
      }
    }
  }
  
  // 显示游戏说明
  showGameInstructions() {
    const instructions = `🏪 魔法商店经营指南

💰 金币来源：
• 工作坊生产完成后自动获得
• 服务顾客销售商品获得
• 升级获得奖励金币
• 观看广告获得离线收益

✨ 附魔来源：
• 附魔台(3级解锁)生产获得
• 高级顾客购买附魔物品
• 特殊事件奖励

💎 钻石(宝石)来源：
• 每5级获得1个钻石奖励
• 完成成就获得钻石
• 观看广告获得额外奖励
• 服务VIP顾客获得

🧪 游戏玩法：
• 点击工作坊开始/收集生产
• 点击顾客进行交易
• 升级设施提高效率
• 合理管理库存和资源

🎯 成长策略：
• 优先升级药水实验室
• 保持足够库存服务顾客
• 观看广告获得加速和奖励
• 解锁更多高级设施`

    if (typeof wx !== 'undefined' && wx.showModal) {
      wx.showModal({
        title: '游戏说明',
        content: instructions,
        showCancel: false,
        confirmText: '知道了'
      })
    } else {
      // fallback: 使用浏览器alert
      alert('游戏说明\n\n' + instructions)
    }
  }
  
  // 确认重新开始游戏
  confirmResetGame() {
    if (typeof wx !== 'undefined' && wx.showModal) {
      wx.showModal({
        title: '重新开始',
        content: '是否要重新开始游戏？\n（当前进度将会丢失）',
        confirmText: '重新开始',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            // 重置游戏数据
            this.dataManager.resetGameData()
            // 返回开始屏幕
            this.showingStartScreen = true
            this.gamePaused = false
            this.showingUpgradePanel = false
            this.showingStatsPanel = false
          }
        }
      })
    } else {
      // fallback: 直接重置
      if (confirm('是否要重新开始游戏？\n（当前进度将会丢失）')) {
        this.dataManager.resetGameData()
        this.showingStartScreen = true
        this.gamePaused = false
        this.showingUpgradePanel = false
        this.showingStatsPanel = false
      }
    }
  }
  
  // 显示库存不足提示
  showInsufficientStockNotice() {
    this.showingInsufficientStockNotice = true
  }
  
  // 隐藏库存不足提示
  hideInsufficientStockNotice() {
    this.showingInsufficientStockNotice = false
  }
  
  // 切换自动售卖功能
  toggleAutoSell() {
    console.log('toggleAutoSell called')
    
    // 初始化设置对象如果不存在
    if (!this.dataManager.gameData.settings) {
      this.dataManager.gameData.settings = {
        autoSellEnabled: false  // 确保默认为关闭状态
      }
    }
    
    // 如果autoSellEnabled属性不存在，设置为false
    if (this.dataManager.gameData.settings.autoSellEnabled === undefined) {
      this.dataManager.gameData.settings.autoSellEnabled = false
    }
    
    // 切换自动售卖状态
    const currentState = this.dataManager.gameData.settings.autoSellEnabled
    this.dataManager.gameData.settings.autoSellEnabled = !currentState
    const newState = this.dataManager.gameData.settings.autoSellEnabled
    
    console.log(`自动售卖状态从 ${currentState} 切换到 ${newState}`)
    
    // 创建状态提示
    const message = newState ? '🤖 自动售卖已开启' : '⏸️ 自动售卖已关闭'
    const color = newState ? '#00FF00' : '#FF9800'
    
    // 显示浮动提示
    this.gameManager.createFloatingText(message, this.canvas.width / 2, this.canvas.height / 2, color, 16)
    
    // 创建轻型烟花效果替代抖动
    const buttonRect = this.uiElements.autoSellButton
    this.gameManager.createFireworkEffect(
      buttonRect.x + buttonRect.width / 2, 
      buttonRect.y + buttonRect.height / 2, 
      color
    )
    
    // 保存设置
    this.dataManager.markDirty()
    
    console.log(`自动售卖功能已${newState ? '开启' : '关闭'}`)
  }
  
  // 获取顾客生成区域 - 避免与底部UI重叠
  getCustomerSpawnArea() {
    const bottomUIHeight = this.bottomBarCollapsed ? 40 : this.uiConfig.bottomBarHeight
    return {
      minY: this.uiConfig.topBarHeight,
      maxY: this.canvas.height - bottomUIHeight - 60 // 额外缓冲空间
    }
  }
  
  // 工具方法
  isPointInRect(x, y, rect) {
    return rect && x >= rect.x && x <= rect.x + rect.width && 
           y >= rect.y && y <= rect.y + rect.height
  }
  
  formatNumber(num) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }
  
  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    if (hours > 0) {
      return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`
    }
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`
  }
}
