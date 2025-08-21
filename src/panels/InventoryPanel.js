import UIUtils from '../utils/UIUtils.js'

// 背包面板组件
export default class InventoryPanel {
  constructor(ctx, canvas) {
    this.ctx = ctx
    this.canvas = canvas
    this.isVisible = false
    this.closeButton = null
    this.inventoryButtons = []
    this.dataManager = null
    this.gameManager = null
    this.currentTab = 'materials' // materials, boosts, items
    this.tabs = [
      { id: 'materials', name: '材料', icon: '🔧' },
      { id: 'boosts', name: '增益', icon: '⚡' },
      { id: 'items', name: '物品', icon: '📦' }
    ]
    
    // 滚动相关
    this.scrollY = 0
    this.maxScrollY = 0
    this.itemHeight = 65
    this.itemSpacing = 5
  }
  
  setManagers(managers) {
    this.dataManager = managers.dataManager
    this.gameManager = managers.gameManager
  }
  
  show() {
    this.isVisible = true
  }
  
  hide() {
    this.isVisible = false
  }
  
  render() {
    if (!this.isVisible) return
    
    const panelWidth = Math.min(380, this.canvas.width - 30)
    const panelHeight = 600
    const x = (this.canvas.width - panelWidth) / 2
    const y = (this.canvas.height - panelHeight) / 2
    
    // 半透明背景
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    
    // 面板背景 - 魔法商店主题色
    this.ctx.fillStyle = '#2C1810'
    this.ctx.fillRect(x, y, panelWidth, panelHeight)
    this.ctx.strokeStyle = '#FFD700'
    this.ctx.lineWidth = 3
    this.ctx.strokeRect(x, y, panelWidth, panelHeight)
    
    // 标题
    this.ctx.fillStyle = '#FFD700'
    this.ctx.font = 'bold 20px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('🎒 魔法背包', x + panelWidth / 2, y + 35)
    
    // 标签页
    this.renderTabs(x, y + 50, panelWidth)
    
    // 根据当前标签页渲染内容
    this.renderTabContent(x, y + 90, panelWidth, panelHeight - 140)
    
    // 关闭按钮
    this.closeButton = {
      x: x + panelWidth - 40,
      y: y + 10,
      width: 30,
      height: 30
    }
    this.renderCloseButton()
  }
  
  renderTabs(x, y, width) {
    const tabHeight = 30
    const tabWidth = Math.floor(width / this.tabs.length)
    
    this.tabs.forEach((tab, index) => {
      const tabX = x + index * tabWidth
      const isActive = tab.id === this.currentTab
      
      // 标签背景
      this.ctx.fillStyle = isActive ? '#8B4513' : '#654321'
      this.ctx.fillRect(tabX, y, tabWidth, tabHeight)
      this.ctx.strokeStyle = '#FFD700'
      this.ctx.lineWidth = isActive ? 2 : 1
      this.ctx.strokeRect(tabX, y, tabWidth, tabHeight)
      
      // 标签文字
      this.ctx.fillStyle = isActive ? '#FFD700' : '#CCCCCC'
      this.ctx.font = '12px Arial'
      this.ctx.textAlign = 'center'
      this.ctx.fillText(`${tab.icon} ${tab.name}`, tabX + tabWidth / 2, y + tabHeight / 2 + 4)
    })
  }
  
  renderTabContent(x, y, width, height) {
    this.inventoryButtons = []
    
    switch (this.currentTab) {
      case 'materials':
        this.renderMaterials(x, y, width, height)
        break
      case 'boosts':
        this.renderActiveBoosts(x, y, width, height)
        break
      case 'items':
        this.renderItems(x, y, width, height)
        break
    }
  }
  
  renderMaterials(x, y, width, height) {
    if (!this.dataManager) return
    
    const materials = this.dataManager.gameData.materials || {}
    const materialTypes = [
      { key: 'iron', name: '铁矿', icon: '⚙️', description: '用于升级工作台的基础材料' },
      { key: 'wood', name: '魔法木材', icon: '🪵', description: '制作魔法装置的特殊木材' },
      { key: 'crystal', name: '魔法水晶', icon: '💎', description: '高级升级所需的珍贵材料' },
      { key: 'essence', name: '魔法精华', icon: '✨', description: '最稀有的升级材料' }
    ]
    
    let currentY = y + 10
    const itemHeight = 60
    const itemSpacing = 5
    
    materialTypes.forEach(material => {
      const amount = materials[material.key] || 0
      const itemRect = {
        x: x + 10,
        y: currentY,
        width: width - 20,
        height: itemHeight
      }
      
      this.renderMaterialItem(material, amount, itemRect)
      currentY += itemHeight + itemSpacing
    })
    
    // 如果没有材料，显示提示
    if (Object.keys(materials).length === 0 || Object.values(materials).every(v => v === 0)) {
      this.ctx.fillStyle = '#CCCCCC'
      this.ctx.font = '14px Arial'
      this.ctx.textAlign = 'center'
      this.ctx.fillText('暂无材料', x + width / 2, y + height / 2)
      this.ctx.fillStyle = '#999999'
      this.ctx.font = '12px Arial'
      this.ctx.fillText('可在商店购买材料包获得', x + width / 2, y + height / 2 + 20)
    }
  }
  
  renderMaterialItem(material, amount, rect) {
    // 背景
    const gradient = this.ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.height)
    gradient.addColorStop(0, '#8B4513')
    gradient.addColorStop(1, '#654321')
    
    this.ctx.fillStyle = gradient
    this.ctx.fillRect(rect.x, rect.y, rect.width, rect.height)
    this.ctx.strokeStyle = '#FFD700'
    this.ctx.lineWidth = 1
    this.ctx.strokeRect(rect.x, rect.y, rect.width, rect.height)
    
    // 图标
    this.ctx.fillStyle = '#FFD700'
    this.ctx.font = '20px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText(material.icon, rect.x + 30, rect.y + 30)
    
    // 名称
    this.ctx.fillStyle = '#FFFFFF'
    this.ctx.font = 'bold 14px Arial'
    this.ctx.textAlign = 'left'
    this.ctx.fillText(material.name, rect.x + 60, rect.y + 20)
    
    // 描述
    this.ctx.fillStyle = '#CCCCCC'
    this.ctx.font = '10px Arial'
    this.ctx.fillText(material.description, rect.x + 60, rect.y + 35)
    
    // 数量
    this.ctx.fillStyle = amount > 0 ? '#00FF00' : '#666666'
    this.ctx.font = 'bold 16px Arial'
    this.ctx.textAlign = 'right'
    this.ctx.fillText(`×${amount}`, rect.x + rect.width - 20, rect.y + 30)
  }
  
  renderActiveBoosts(x, y, width, height) {
    if (!this.dataManager) return
    
    const activeBoosts = this.dataManager.gameData.activeBoosts || []
    const currentTime = Date.now()
    
    // 过滤过期的增益效果
    const validBoosts = activeBoosts.filter(boost => {
      return currentTime < boost.startTime + boost.duration
    })
    
    if (validBoosts.length === 0) {
      this.ctx.fillStyle = '#CCCCCC'
      this.ctx.font = '14px Arial'
      this.ctx.textAlign = 'center'
      this.ctx.fillText('暂无激活的增益效果', x + width / 2, y + height / 2)
      this.ctx.fillStyle = '#999999'
      this.ctx.font = '12px Arial'
      this.ctx.fillText('可在商店购买增益道具', x + width / 2, y + height / 2 + 20)
      return
    }
    
    let currentY = y + 10
    const itemHeight = 70
    const itemSpacing = 5
    
    validBoosts.forEach(boost => {
      const itemRect = {
        x: x + 10,
        y: currentY,
        width: width - 20,
        height: itemHeight
      }
      
      this.renderBoostItem(boost, currentTime, itemRect)
      currentY += itemHeight + itemSpacing
    })
  }
  
  renderBoostItem(boost, currentTime, rect) {
    const remainingTime = boost.startTime + boost.duration - currentTime
    const progress = (boost.duration - remainingTime) / boost.duration
    
    // 背景
    const gradient = this.ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.height)
    gradient.addColorStop(0, '#4CAF50')
    gradient.addColorStop(1, '#388E3C')
    
    this.ctx.fillStyle = gradient
    this.ctx.fillRect(rect.x, rect.y, rect.width, rect.height)
    this.ctx.strokeStyle = '#FFD700'
    this.ctx.lineWidth = 2
    this.ctx.strokeRect(rect.x, rect.y, rect.width, rect.height)
    
    // 获取增益图标
    let icon = '⚡'
    switch (boost.type) {
      case 'speed_boost': icon = '⚡'; break
      case 'income_boost': icon = '💰'; break
      case 'patience_boost': icon = '⏰'; break
      case 'auto_collect': icon = '🤖'; break
    }
    
    // 图标
    this.ctx.fillStyle = '#FFD700'
    this.ctx.font = '24px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText(icon, rect.x + 30, rect.y + 35)
    
    // 名称
    this.ctx.fillStyle = '#FFFFFF'
    this.ctx.font = 'bold 14px Arial'
    this.ctx.textAlign = 'left'
    this.ctx.fillText(boost.name, rect.x + 60, rect.y + 20)
    
    // 剩余时间
    const minutes = Math.floor(remainingTime / 60000)
    const seconds = Math.floor((remainingTime % 60000) / 1000)
    this.ctx.fillStyle = '#CCCCCC'
    this.ctx.font = '12px Arial'
    this.ctx.fillText(`剩余时间: ${minutes}:${seconds.toString().padStart(2, '0')}`, rect.x + 60, rect.y + 38)
    
    // 进度条
    const progressBarWidth = rect.width - 80
    const progressBarHeight = 6
    const progressBarX = rect.x + 60
    const progressBarY = rect.y + 45
    
    // 进度条背景
    this.ctx.fillStyle = '#333333'
    this.ctx.fillRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight)
    
    // 进度条填充
    this.ctx.fillStyle = '#FFD700'
    this.ctx.fillRect(progressBarX, progressBarY, progressBarWidth * (1 - progress), progressBarHeight)
  }
  
  renderItems(x, y, width, height) {
    // 此处可以显示其他物品，如收集品、装饰品等
    this.ctx.fillStyle = '#CCCCCC'
    this.ctx.font = '14px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('物品栏功能即将开放', x + width / 2, y + height / 2)
    this.ctx.fillStyle = '#999999'
    this.ctx.font = '12px Arial'
    this.ctx.fillText('敬请期待更多收集品和装饰物品', x + width / 2, y + height / 2 + 20)
  }
  
  renderCloseButton() {
    if (!this.closeButton) return
    
    UIUtils.drawRoundRect(this.ctx, this.closeButton, '#FF4444', 12)
    
    // 按钮文字
    this.ctx.fillStyle = '#FFFFFF'
    this.ctx.font = '14px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('✖', this.closeButton.x + this.closeButton.width / 2, this.closeButton.y + this.closeButton.height / 2 + 5)
  }
  
  handleTouch(x, y) {
    if (!this.isVisible) return false
    
    // 检查关闭按钮
    if (this.closeButton && UIUtils.isPointInRect(x, y, this.closeButton)) {
      this.hide()
      return true
    }
    
    // 检查标签页点击
    const tabHeight = 30
    const tabWidth = Math.floor(380 / this.tabs.length)
    const panelX = (this.canvas.width - 380) / 2
    const tabY = (this.canvas.height - 600) / 2 + 50
    
    for (let i = 0; i < this.tabs.length; i++) {
      const tabX = panelX + i * tabWidth
      const tabRect = { x: tabX, y: tabY, width: tabWidth, height: tabHeight }
      
      if (UIUtils.isPointInRect(x, y, tabRect)) {
        this.currentTab = this.tabs[i].id
        this.scrollY = 0 // 切换标签页时重置滚动位置
        return true
      }
    }
    
    return true // 阻止点击穿透
  }
  
  // 处理滚动事件
  handleScroll(deltaY) {
    if (!this.isVisible) return false
    
    const scrollAmount = deltaY * 30 // 调整滚动灵敏度
    this.scrollY += scrollAmount
    this.scrollY = Math.max(0, Math.min(this.scrollY, this.maxScrollY))
    
    return true // 滚动被处理
  }
}
