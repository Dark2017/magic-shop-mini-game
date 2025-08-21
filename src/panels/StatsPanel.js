import UIUtils from '../utils/UIUtils.js'

// 统计面板组件
export default class StatsPanel {
  constructor(ctx, canvas) {
    this.ctx = ctx
    this.canvas = canvas
    this.isVisible = false
    this.closeButton = null
    this.dataManager = null
    this.gameManager = null
    this.questManager = null
  }
  
  setManagers(managers) {
    this.dataManager = managers.dataManager
    this.gameManager = managers.gameManager
    this.questManager = managers.questManager
  }
  
  show() {
    this.isVisible = true
  }
  
  hide() {
    this.isVisible = false
  }
  
  render(dataManager) {
    if (!this.isVisible) return
    
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
    const stats = dataManager.getStats()
    const gameData = dataManager.gameData
    const inventory = dataManager.getInventory()
    
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
    this.ctx.fillText(`当前金币: ${UIUtils.formatNumber(gameData.gold)}`, x + 30, currentY)
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
    this.ctx.fillText(`总收入: ${UIUtils.formatNumber(stats.totalGoldEarned)}`, x + 30, currentY)
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
    this.closeButton = {
      x: x + panelWidth - 40,
      y: y + 10,
      width: 30,
      height: 30
    }
    this.renderCloseButton()
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
    
    return true // 阻止点击穿透
  }
}
