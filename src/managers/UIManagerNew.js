// 新的模块化 UI 管理器
import UIUtils from '../utils/UIUtils.js'
import Button, { CircleButton, AutoSellButton } from '../components/Button.js'
import { BUTTON_TYPES } from '../config/colors.js'
import StatsPanel from '../panels/StatsPanel.js'
import UpgradePanel from '../panels/UpgradePanel.js'
import WorkshopPanel from '../panels/WorkshopPanel.js'
import QuestPanel from '../panels/QuestPanel.js'
import ShopPanel from '../panels/ShopPanel.js'
import InventoryPanel from '../panels/InventoryPanel.js'

export default class UIManagerNew {
  constructor(ctx, canvas) {
    this.ctx = ctx
    this.canvas = canvas
    this.dataManager = null
    this.adManager = null
    this.gameManager = null
    
    // UI状态
    this.showingStartScreen = true
    this.gamePaused = false
    this.bottomBarCollapsed = false
    this.showingInsufficientStockNotice = false
    
    // 底部按钮组滚动状态
    this.buttonScrollX = 0  // 当前滚动位置
    this.maxButtonScrollX = 0  // 最大滚动距离
    this.buttonGroupWidth = 0  // 按钮组总宽度
    this.visibleButtonWidth = 0  // 可见区域宽度
    
    // 触摸滚动状态
    this.touchStart = { x: 0, y: 0 }
    this.isTouching = false
    this.touchStartTime = 0
    
    // 设备适配参数
    this.deviceInfo = UIUtils.getDeviceInfo()
    this.safeArea = UIUtils.calculateSafeArea(this.deviceInfo)
    
    // UI尺寸配置
    this.uiConfig = {
      topBarHeight: Math.max(this.safeArea.top + 100, 120),
      bottomBarHeight: 120,
      buttonMinSize: 50,
      padding: 20,
      borderRadius: 12
    }
    
    // 初始化面板
    this.statsPanel = new StatsPanel(ctx, canvas)
    this.upgradePanel = new UpgradePanel(ctx, canvas)
    this.workshopPanel = new WorkshopPanel(ctx, canvas)
    this.questPanel = new QuestPanel(ctx, canvas)
    this.shopPanel = new ShopPanel(ctx, canvas)
    this.inventoryPanel = new InventoryPanel(ctx, canvas)
    
    // 初始化按钮
    this.initializeButtons()
    
    // UI元素位置
    this.calculateUIElements()
    this.adjustUIForScreen()
  }
  
  initializeButtons() {
    const { bottomBarHeight, padding } = this.uiConfig
    const buttonWidth = 80
    const buttonHeight = 40
    const buttonSpacing = 10
    const buttonY = this.canvas.height - bottomBarHeight + 20
    
    // 计算按钮组滚动参数
    this.calculateButtonScrollParams(buttonWidth, buttonSpacing, padding)
    
    // 创建主要按钮数组，便于管理
    this.mainButtons = []
    
    // 创建主要按钮
    this.statsButton = new Button(
      this.ctx, 
      padding, 
      buttonY, 
      buttonWidth, 
      buttonHeight, 
      '📊 统计', 
      BUTTON_TYPES.SECONDARY
    )
    this.statsButton.setOnClick(() => this.showStatsPanel())
    this.mainButtons.push(this.statsButton)
    
    this.workshopButton = new Button(
      this.ctx, 
      padding + (buttonWidth + buttonSpacing), 
      buttonY, 
      buttonWidth, 
      buttonHeight, 
      '🏭 工作台', 
      BUTTON_TYPES.PRIMARY
    )
    this.workshopButton.setOnClick(() => this.showWorkshopPanel())
    this.mainButtons.push(this.workshopButton)
    
    // 任务按钮
    this.questButton = new Button(
      this.ctx, 
      padding + (buttonWidth + buttonSpacing) * 2, 
      buttonY, 
      buttonWidth, 
      buttonHeight, 
      '📋 任务', 
      BUTTON_TYPES.INFO
    )
    this.questButton.setOnClick(() => this.showQuestPanel())
    this.mainButtons.push(this.questButton)
    
    // 商店按钮
    this.shopButton = new Button(
      this.ctx, 
      padding + (buttonWidth + buttonSpacing) * 3, 
      buttonY, 
      buttonWidth, 
      buttonHeight, 
      '🛒 商店', 
      BUTTON_TYPES.WARNING
    )
    this.shopButton.setOnClick(() => this.showShopPanel())
    this.mainButtons.push(this.shopButton)
    
    // 背包按钮
    this.inventoryButton = new Button(
      this.ctx, 
      padding + (buttonWidth + buttonSpacing) * 4, 
      buttonY, 
      buttonWidth, 
      buttonHeight, 
      '🎒 背包', 
      BUTTON_TYPES.SUCCESS
    )
    this.inventoryButton.setOnClick(() => this.showInventoryPanel())
    this.mainButtons.push(this.inventoryButton)
    
    // 自动售卖按钮 - 也加入到主按钮组
    this.autoSellButton = new AutoSellButton(
      this.ctx,
      padding + (buttonWidth + buttonSpacing) * 5,
      buttonY,
      buttonWidth,
      buttonHeight,
      null, // 将在 setManagers 中设置
      null  // 将在 setManagers 中设置
    )
    this.mainButtons.push(this.autoSellButton)
    
    // 收缩按钮 - 放在右上角，独立于按钮组
    this.collapseButton = new Button(
      this.ctx,
      this.canvas.width - 50, // 右边距离边缘50px
      this.canvas.height - bottomBarHeight - 30, // 在底部栏上方
      40,
      25,
      '⬇️',
      BUTTON_TYPES.SECONDARY
    )
    this.collapseButton.setOnClick(() => { this.bottomBarCollapsed = true })
    
    // 展开按钮 - 放在右下角
    this.expandButton = new Button(
      this.ctx,
      this.canvas.width - 50,
      this.canvas.height - 35,
      40,
      30,
      '⬆️',
      BUTTON_TYPES.SECONDARY
    )
    this.expandButton.setOnClick(() => { this.bottomBarCollapsed = false })
    
    // 右上角圆形按钮
    const smallButtonSize = 15
    const topButtonSpacing = 16  // 增加间距到16px
    const statusBarPadding = 10 // 与calculateUIElements中保持一致
    
    this.menuButton = new CircleButton(
      this.ctx,
      this.canvas.width - padding - smallButtonSize,
      88 + statusBarPadding + 16,  // 与顶部状态栏平齐 (fixedTopMargin + statusBarPadding + 状态栏高度的一半)
      smallButtonSize,
      '设置',
      '#4CAF50'
    )
    this.menuButton.setOnClick(() => this.showGameMenu())
    
    this.pauseButton = new CircleButton(
      this.ctx,
      this.canvas.width - padding - (smallButtonSize * 2 + topButtonSpacing),
      88 + statusBarPadding + 16,  // 与顶部状态栏平齐 (fixedTopMargin + statusBarPadding + 状态栏高度的一半)
      smallButtonSize,
      '暂停',
      '#FF9800'
    )
    this.pauseButton.setOnClick(() => this.togglePause())
    
    // 开始屏幕按钮
    this.startButton = new Button(
      this.ctx,
      this.canvas.width / 2 - 80,
      this.canvas.height / 2 + 20,
      160,
      50,
      '🎮 开始游戏',
      BUTTON_TYPES.SUCCESS
    )
    this.startButton.setOnClick(() => this.startGame())
    
    // 暂停屏幕按钮
    this.resumeButton = new Button(
      this.ctx,
      this.canvas.width / 2 - 80,
      this.canvas.height / 2 + 40,
      160,
      50,
      '▶️ 继续游戏',
      BUTTON_TYPES.SUCCESS
    )
    this.resumeButton.setOnClick(() => this.resumeGame())
  }
  
  setManagers(managers) {
    this.dataManager = managers.dataManager
    this.adManager = managers.adManager
    this.gameManager = managers.gameManager
    this.questManager = managers.questManager
    
    // 设置自动售卖按钮的依赖
    this.autoSellButton.dataManager = this.dataManager
    this.autoSellButton.gameManager = this.gameManager
    
    // 设置各个面板的管理器引用
    this.statsPanel.setManagers(managers)
    this.upgradePanel.setManagers(managers)
    this.workshopPanel.setManagers(managers)
    this.questPanel.setManagers(managers)
    this.shopPanel.setManagers(managers)
    this.inventoryPanel.setManagers(managers)
  }
  
  update() {
    // UI更新逻辑
    this.updateButtonPositions()
  }
  
  calculateButtonScrollParams(buttonWidth, buttonSpacing, padding) {
    // 计算按钮组总宽度（6个按钮）
    this.buttonGroupWidth = (buttonWidth + buttonSpacing) * 6 - buttonSpacing + padding * 2
    
    // 计算可见区域宽度（左右各保持相同边距，确保视觉平衡）
    const sideMargin = 40 // 左右各40px边距，确保视觉平衡
    this.visibleButtonWidth = this.canvas.width - sideMargin * 2
    
    // 计算最大滚动距离
    this.maxButtonScrollX = Math.max(0, this.buttonGroupWidth - this.visibleButtonWidth)
  }
  
  updateButtonPositions() {
    // 动态更新按钮位置
    const { bottomBarHeight, padding } = this.uiConfig
    const buttonWidth = 80
    const buttonSpacing = 10
    const buttonY = this.canvas.height - bottomBarHeight + 20
    const sideMargin = 40 // 与calculateButtonScrollParams中保持一致
    
    // 重新计算滚动参数（应对屏幕变化）
    this.calculateButtonScrollParams(buttonWidth, buttonSpacing, padding)
    
    // 限制滚动位置
    this.buttonScrollX = Math.max(0, Math.min(this.buttonScrollX, this.maxButtonScrollX))
    
    // 更新主按钮位置（应用滚动偏移，从左侧边距开始）
    this.mainButtons.forEach((button, index) => {
      const baseX = sideMargin + (buttonWidth + buttonSpacing) * index - this.buttonScrollX
      button.setPosition(baseX, buttonY)
    })
    
    // 更新缩放按钮位置（独立于滚动）
    this.collapseButton.setPosition(this.canvas.width - 50, this.canvas.height - bottomBarHeight - 30)
    this.expandButton.setPosition(this.canvas.width - 50, this.canvas.height - 35)
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
    this.statsPanel.render(this.dataManager)
    this.upgradePanel.render(this.dataManager, this.gameManager)
    this.workshopPanel.render(this.dataManager, this.gameManager)
    this.questPanel.render()
    this.shopPanel.render()
    this.inventoryPanel.render()
    
    // 渲染库存不足提示（最高层级）
    if (this.showingInsufficientStockNotice) {
      this.renderInsufficientStockNotice('请生产更多商品或升级设施！')
    }
  }
  
  renderTopBar() {
    const { padding } = this.uiConfig
    const fixedTopMargin = 88
    
    // 魔法商店标题
    this.ctx.fillStyle = '#FFD700'
    this.ctx.font = 'bold 16px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.strokeStyle = '#8B4513'
    this.ctx.lineWidth = 2
    this.ctx.strokeText('魔法商店', this.canvas.width / 2, fixedTopMargin - 35)
    this.ctx.fillText('魔法商店', this.canvas.width / 2, fixedTopMargin - 35)
    
    // 资源显示
    this.renderResourceDisplay(
      this.uiElements.goldDisplay,
      '金币',
      UIUtils.formatNumber(this.dataManager.getGold()),
      '#FFD700'
    )
    
    this.renderResourceDisplay(
      this.uiElements.gemsDisplay,
      '宝石',
      this.dataManager.getGems().toString(),
      '#FF69B4'
    )
    
    this.renderLevelDisplay()
    
    // 右上角按钮
    this.pauseButton.render()
    this.menuButton.render()
  }
  
  renderBottomBar() {
    const { bottomBarHeight } = this.uiConfig
    
    // 如果面板收缩，只显示展开按钮
    if (this.bottomBarCollapsed) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
      this.ctx.fillRect(0, this.canvas.height - 40, this.canvas.width, 40)
      this.expandButton.render()
      return
    }
    
    // 正常状态：显示完整底部栏
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
    this.ctx.fillRect(0, this.canvas.height - bottomBarHeight, this.canvas.width, bottomBarHeight)
    
    // 渲染按钮组（带滚动）
    this.renderScrollableButtonGroup()
    
    // 渲染独立的缩放按钮
    this.collapseButton.render()
  }
  
  renderScrollableButtonGroup() {
    const { bottomBarHeight } = this.uiConfig
    const buttonGroupY = this.canvas.height - bottomBarHeight + 20
    const buttonGroupHeight = 40
    const sideMargin = 40  // 统一的边距，与calculateButtonScrollParams中一致
    
    // 保存当前绘图状态
    this.ctx.save()
    
    // 设置裁剪区域，从左侧边距开始显示可见的按钮区域
    this.ctx.beginPath()
    this.ctx.rect(sideMargin, buttonGroupY, this.visibleButtonWidth, buttonGroupHeight)
    this.ctx.clip()
    
    // 渲染可见的按钮
    this.mainButtons.forEach(button => {
      // 检查按钮是否在可见区域内（考虑左侧间距）
      if (button.x + button.width > sideMargin && button.x < sideMargin + this.visibleButtonWidth) {
        button.render()
      }
    })
    
    // 恢复绘图状态
    this.ctx.restore()
    
    // 渲染滚动条（如果需要）
    if (this.maxButtonScrollX > 0) {
      this.renderButtonScrollbar()
    }
  }
  
  renderButtonScrollbar() {
    const { bottomBarHeight } = this.uiConfig
    const scrollbarHeight = 4
    const scrollbarY = this.canvas.height - bottomBarHeight + 65
    const sideMargin = 40  // 统一的边距，与其他地方保持一致
    const scrollbarWidth = this.visibleButtonWidth - 20
    const scrollbarX = sideMargin + 10  // 滚动条从左侧边距开始，再加10px内边距
    
    // 滚动条背景
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
    this.ctx.fillRect(scrollbarX, scrollbarY, scrollbarWidth, scrollbarHeight)
    
    // 滚动条滑块
    const thumbWidth = (this.visibleButtonWidth / this.buttonGroupWidth) * scrollbarWidth
    const thumbX = scrollbarX + (this.buttonScrollX / this.maxButtonScrollX) * (scrollbarWidth - thumbWidth)
    
    this.ctx.fillStyle = 'rgba(255, 215, 0, 0.8)'
    this.ctx.fillRect(thumbX, scrollbarY, thumbWidth, scrollbarHeight)
  }
  
  renderResourceDisplay(rect, label, value, color) {
    // 背景
    const gradient = this.ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.height)
    gradient.addColorStop(0, 'rgba(139, 69, 19, 0.8)')
    gradient.addColorStop(1, 'rgba(101, 67, 33, 0.9)')
    this.ctx.fillStyle = gradient
    this.ctx.fillRect(rect.x, rect.y, rect.width, rect.height)
    
    // 边框
    this.ctx.strokeStyle = '#FFD700'
    this.ctx.lineWidth = 2
    this.ctx.strokeRect(rect.x, rect.y, rect.width, rect.height)
    
    // 标签
    this.ctx.fillStyle = color
    this.ctx.font = '12px Arial'
    this.ctx.textAlign = 'left'
    this.ctx.fillText(label, rect.x + 4, rect.y + 14)
    
    // 数值
    this.ctx.fillStyle = '#FFFFFF'
    this.ctx.font = 'bold 13px Arial'
    this.ctx.fillText(value, rect.x + 4, rect.y + 28)
  }
  
  renderLevelDisplay() {
    const rect = this.uiElements.levelDisplay
    const gameData = this.dataManager.gameData
    
    // 背景
    const gradient = this.ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.height)
    gradient.addColorStop(0, 'rgba(147, 112, 219, 0.8)')
    gradient.addColorStop(1, 'rgba(138, 43, 226, 0.9)')
    this.ctx.fillStyle = gradient
    this.ctx.fillRect(rect.x, rect.y, rect.width, rect.height)
    
    // 边框
    this.ctx.strokeStyle = '#FFD700'
    this.ctx.lineWidth = 2
    this.ctx.strokeRect(rect.x, rect.y, rect.width, rect.height)
    
    // 等级
    this.ctx.fillStyle = '#FFD700'
    this.ctx.font = 'bold 16px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText(`Lv.${gameData.level}`, rect.x + rect.width / 2, rect.y + 20)
    
    // 经验条
    const expPercent = gameData.exp / gameData.expToNext
    const barWidth = rect.width - 12
    const barHeight = 6
    
    this.ctx.fillStyle = '#333333'
    this.ctx.fillRect(rect.x + 6, rect.y + 25, barWidth, barHeight)
    
    this.ctx.fillStyle = '#00FF00'
    this.ctx.fillRect(rect.x + 6, rect.y + 25, barWidth * expPercent, barHeight)
  }
  
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
    this.startButton.render()
  }
  
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
    this.resumeButton.render()
  }
  
  renderInsufficientStockNotice(message) {
    const noticeWidth = 280
    const noticeHeight = 100
    const x = (this.canvas.width - noticeWidth) / 2
    const y = (this.canvas.height - noticeHeight) / 2
    
    // 半透明背景遮罩
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    
    // 提示框背景
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
    this.ctx.fillStyle = '#FFFFFF'
    this.ctx.font = 'bold 14px Arial'
    this.ctx.fillText('✖', closeX + closeButtonSize / 2, closeY + closeButtonSize / 2 + 4)
    
    // 保存关闭按钮位置用于点击检测
    this.insufficientStockCloseButton = {
      x: closeX,
      y: closeY,
      width: closeButtonSize,
      height: closeButtonSize
    }
  }
  
  calculateUIElements() {
    const { padding } = this.uiConfig
    const fixedTopMargin = 88
    const statusBarPadding = 10 // 确保顶部状态栏至少10px padding
    
    // 顶部资源显示
    const resourceWidth = 85
    const resourceHeight = 32
    const levelWidth = 75
    
    this.uiElements = {
      goldDisplay: {
        x: padding,
        y: fixedTopMargin + statusBarPadding,
        width: resourceWidth,
        height: resourceHeight
      },
      
      gemsDisplay: {
        x: padding + resourceWidth + 8,
        y: fixedTopMargin + statusBarPadding,
        width: resourceWidth,
        height: resourceHeight
      },
      
      levelDisplay: {
        x: padding + (resourceWidth + 8) * 2,
        y: fixedTopMargin + statusBarPadding,
        width: levelWidth,
        height: resourceHeight
      }
    }
  }
  
  adjustUIForScreen() {
    // 根据屏幕尺寸调整UI元素
    if (this.canvas.width < 400) {
      this.uiConfig.padding = 8
      this.uiConfig.buttonMinSize = 40
    }
  }
  
  handleTouch(x, y) {
    console.log('UIManagerNew.handleTouch called with:', x, y)
    
    // 检查库存不足提示关闭按钮
    if (this.showingInsufficientStockNotice && this.insufficientStockCloseButton) {
      if (UIUtils.isPointInRect(x, y, this.insufficientStockCloseButton)) {
        this.showingInsufficientStockNotice = false
        return true
      }
    }
    
    // 如果显示开始屏幕
    if (this.showingStartScreen) {
      return this.startButton.handleTouch(x, y)
    }
    
    // 如果游戏暂停
    if (this.gamePaused) {
      return this.resumeButton.handleTouch(x, y)
    }
    
    // 面板相关触摸处理
    if (this.statsPanel.isVisible) {
      return this.statsPanel.handleTouch(x, y)
    }
    
    if (this.upgradePanel.isVisible) {
      return this.upgradePanel.handleTouch(x, y, this.gameManager)
    }
    
    if (this.workshopPanel.isVisible) {
      return this.workshopPanel.handleTouch(x, y, this.dataManager, this.gameManager, this.adManager)
    }
    
    if (this.questPanel.isVisible) {
      return this.questPanel.handleTouch(x, y)
    }
    
    if (this.shopPanel.isVisible) {
      return this.shopPanel.handleTouch(x, y)
    }
    
    if (this.inventoryPanel.isVisible) {
      return this.inventoryPanel.handleTouch(x, y)
    }
    
    // 主界面触摸处理
    return this.handleMainUITouch(x, y)
  }
  
  // 触摸开始事件
  handleTouchStart(x, y) {
    this.touchStart = { x, y }
    this.isTouching = true
    this.touchStartTime = Date.now()
    
    // 传递给面板
    if (this.questPanel && this.questPanel.isVisible && typeof this.questPanel.handleTouchStart === 'function') {
      this.questPanel.handleTouchStart(x, y)
    }
    if (this.shopPanel && this.shopPanel.isVisible && typeof this.shopPanel.handleTouchStart === 'function') {
      this.shopPanel.handleTouchStart(x, y)
    }
    if (this.inventoryPanel && this.inventoryPanel.isVisible && typeof this.inventoryPanel.handleTouchStart === 'function') {
      this.inventoryPanel.handleTouchStart(x, y)
    }
  }
  
  // 触摸移动事件
  handleTouchMove(x, y) {
    if (!this.isTouching) return false
    
    const deltaX = x - this.touchStart.x
    const deltaY = y - this.touchStart.y
    
    // 传递给可见的面板处理垂直滚动
    if (this.questPanel && this.questPanel.isVisible && typeof this.questPanel.handleTouchMove === 'function') {
      if (this.questPanel.handleTouchMove(x, y, deltaX, deltaY)) {
        return true
      }
    }
    
    if (this.shopPanel && this.shopPanel.isVisible && typeof this.shopPanel.handleTouchMove === 'function') {
      if (this.shopPanel.handleTouchMove(x, y, deltaX, deltaY)) {
        return true
      }
    }
    
    if (this.inventoryPanel && this.inventoryPanel.isVisible && typeof this.inventoryPanel.handleTouchMove === 'function') {
      if (this.inventoryPanel.handleTouchMove(x, y, deltaX, deltaY)) {
        return true
      }
    }
    
    // 如果没有面板处理，检查是否在底部按钮区域进行横向滚动
    if (!this.bottomBarCollapsed && this.maxButtonScrollX > 0) {
      const { bottomBarHeight } = this.uiConfig
      const buttonGroupY = this.canvas.height - bottomBarHeight + 20
      const buttonGroupHeight = 40
      
      // 检查是否在按钮区域内
      if (y >= buttonGroupY && y <= buttonGroupY + buttonGroupHeight) {
        // 横向滚动
        const scrollAmount = -deltaX * 0.8 // 滚动方向相反，调整灵敏度
        this.buttonScrollX = Math.max(0, Math.min(this.buttonScrollX + scrollAmount, this.maxButtonScrollX))
        this.updateButtonPositions()
        return true
      }
    }
    
    return false
  }
  
  // 触摸结束事件
  handleTouchEnd(x, y) {
    if (!this.isTouching) return false
    
    const touchDuration = Date.now() - this.touchStartTime
    const deltaX = x - this.touchStart.x
    const deltaY = y - this.touchStart.y
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    
    this.isTouching = false
    
    // 传递给面板
    if (this.questPanel && this.questPanel.isVisible && typeof this.questPanel.handleTouchEnd === 'function') {
      if (this.questPanel.handleTouchEnd(x, y, deltaX, deltaY, touchDuration)) {
        return true
      }
    }
    
    if (this.shopPanel && this.shopPanel.isVisible && typeof this.shopPanel.handleTouchEnd === 'function') {
      if (this.shopPanel.handleTouchEnd(x, y, deltaX, deltaY, touchDuration)) {
        return true
      }
    }
    
    if (this.inventoryPanel && this.inventoryPanel.isVisible && typeof this.inventoryPanel.handleTouchEnd === 'function') {
      if (this.inventoryPanel.handleTouchEnd(x, y, deltaX, deltaY, touchDuration)) {
        return true
      }
    }
    
    // 如果是短距离快速滑动，判断为点击
    if (distance < 10 && touchDuration < 300) {
      return this.handleTouch(x, y)
    }
    
    return false
  }
  
  // 处理滚动事件
  handleScroll(deltaY) {
    console.log('UIManagerNew.handleScroll called with deltaY:', deltaY)
    
    // 如果任务面板可见，传递滚动事件给任务面板
    if (this.questPanel && this.questPanel.isVisible) {
      if (this.questPanel.handleScroll(deltaY)) {
        return true // 滚动被任务面板处理
      }
    }
    
    // 如果商店面板可见，传递滚动事件给商店面板
    if (this.shopPanel && this.shopPanel.isVisible && typeof this.shopPanel.handleScroll === 'function') {
      if (this.shopPanel.handleScroll(deltaY)) {
        return true
      }
    }
    
    // 如果背包面板可见，传递滚动事件给背包面板
    if (this.inventoryPanel && this.inventoryPanel.isVisible && typeof this.inventoryPanel.handleScroll === 'function') {
      if (this.inventoryPanel.handleScroll(deltaY)) {
        return true
      }
    }
    
    // 如果统计面板可见且有滚动处理方法
    if (this.statsPanel && this.statsPanel.isVisible && typeof this.statsPanel.handleScroll === 'function') {
      if (this.statsPanel.handleScroll(deltaY)) {
        return true
      }
    }
    
    // 如果工作台面板可见且有滚动处理方法
    if (this.workshopPanel && this.workshopPanel.isVisible && typeof this.workshopPanel.handleScroll === 'function') {
      if (this.workshopPanel.handleScroll(deltaY)) {
        return true
      }
    }
    
    // 如果升级面板可见且有滚动处理方法
    if (this.upgradePanel && this.upgradePanel.isVisible && typeof this.upgradePanel.handleScroll === 'function') {
      if (this.upgradePanel.handleScroll(deltaY)) {
        return true
      }
    }
    
    // 如果没有面板打开，检查是否在底部按钮区域，处理按钮组横向滚动
    if (!this.bottomBarCollapsed && this.maxButtonScrollX > 0) {
      const { bottomBarHeight } = this.uiConfig
      const buttonGroupY = this.canvas.height - bottomBarHeight + 20
      const buttonGroupHeight = 40
      
      // 简单检查是否在按钮区域（这里可以根据需要更精确地检查鼠标位置）
      // 由于这是滚动事件，我们直接处理按钮组滚动
      const scrollAmount = deltaY * 0.5 // 调整滚动速度
      this.buttonScrollX = Math.max(0, Math.min(this.buttonScrollX + scrollAmount, this.maxButtonScrollX))
      
      // 更新按钮位置
      this.updateButtonPositions()
      
      return true // 滚动被按钮组处理
    }
    
    return false // 滚动未被处理
  }
  
  handleMainUITouch(x, y) {
    console.log('handleMainUITouch called with:', x, y)
    
    // 右上角按钮
    if (this.pauseButton.handleTouch(x, y)) return true
    if (this.menuButton.handleTouch(x, y)) return true
    
    // 底部按钮处理
    if (this.bottomBarCollapsed) {
      if (this.expandButton.handleTouch(x, y)) return true
    } else {
      if (this.statsButton.handleTouch(x, y)) return true
      if (this.workshopButton.handleTouch(x, y)) return true
      if (this.questButton.handleTouch(x, y)) return true
      if (this.shopButton.handleTouch(x, y)) return true
      if (this.inventoryButton.handleTouch(x, y)) return true
      if (this.autoSellButton.handleTouch(x, y)) return true
      if (this.collapseButton.handleTouch(x, y)) return true
    }
    
    return false
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
  
  showStatsPanel() {
    this.statsPanel.show()
  }
  
  showUpgradePanel() {
    this.upgradePanel.show()
  }
  
  showWorkshopPanel() {
    this.workshopPanel.show()
  }
  
  showQuestPanel() {
    this.questPanel.show()
  }
  
  showShopPanel() {
    this.shopPanel.show()
  }
  
  showInventoryPanel() {
    this.inventoryPanel.show()
  }
  
  showWorkshopDetailPanel() {
    // 与 showWorkshopPanel 相同的功能，保持兼容性
    this.workshopPanel.show()
  }
  
  showGameMenu() {
    // 显示设置菜单
    if (typeof wx !== 'undefined' && wx.showActionSheet) {
      wx.showActionSheet({
        itemList: ['游戏说明', '重新开始游戏'],
        success: (res) => {
          if (res.tapIndex === 0) {
            this.showGameInstructions()
          } else if (res.tapIndex === 1) {
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
      alert('游戏说明\n\n' + instructions)
    }
  }
  
  confirmResetGame() {
    if (typeof wx !== 'undefined' && wx.showModal) {
      wx.showModal({
        title: '重新开始',
        content: '是否要重新开始游戏？\n（当前进度将会丢失）',
        confirmText: '重新开始',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            this.dataManager.resetGameData()
            this.showingStartScreen = true
            this.gamePaused = false
            this.statsPanel.hide()
            this.upgradePanel.hide()
            this.workshopPanel.hide()
          }
        }
      })
    } else {
      if (confirm('是否要重新开始游戏？\n（当前进度将会丢失）')) {
        this.dataManager.resetGameData()
        this.showingStartScreen = true
        this.gamePaused = false
        this.statsPanel.hide()
        this.upgradePanel.hide()
        this.workshopPanel.hide()
      }
    }
  }
  
  showInsufficientStockNotice() {
    this.showingInsufficientStockNotice = true
  }
  
  hideInsufficientStockNotice() {
    this.showingInsufficientStockNotice = false
  }
  
  getCustomerSpawnArea() {
    const bottomUIHeight = this.bottomBarCollapsed ? 40 : this.uiConfig.bottomBarHeight
    return {
      minY: this.uiConfig.topBarHeight,
      maxY: this.canvas.height - bottomUIHeight - 60
    }
  }
  
  // 任务系统回调方法
  onQuestsUpdated() {
    // 通知任务面板更新
    if (this.questPanel && typeof this.questPanel.onQuestsUpdated === 'function') {
      this.questPanel.onQuestsUpdated()
    }
  }
}
