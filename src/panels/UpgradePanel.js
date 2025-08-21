import UIUtils from '../utils/UIUtils.js'

// 升级面板组件
export default class UpgradePanel {
  constructor(ctx, canvas) {
    this.ctx = ctx
    this.canvas = canvas
    this.isVisible = false
    this.closeButton = null
    this.upgradeButtons = []
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
  
  render(dataManager, gameManager) {
    if (!this.isVisible) return
    
    const panelWidth = Math.min(350, this.canvas.width - 30)
    const panelHeight = 480
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
    this.ctx.fillText('⬆️ 设施升级', x + panelWidth / 2, y + 35)
    
    // 升级选项
    const workshops = dataManager.getWorkshops()
    let currentY = y + 70
    this.upgradeButtons = []
    
    workshops.forEach((workshop, index) => {
      const upgradeRect = {
        x: x + 25,
        y: currentY,
        width: panelWidth - 50,
        height: 80
      }
      
      // 计算升级费用
      const goldCost = workshop.upgradeGoldCost || (workshop.level * 100)
      const gemCost = workshop.upgradeGemCost || 0
      const canAffordGold = dataManager.getGold() >= goldCost
      const canAffordGems = dataManager.getGems() >= gemCost
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
      
      // 设施名称
      this.ctx.fillStyle = '#FFFFFF'
      this.ctx.font = 'bold 16px Arial'
      this.ctx.textAlign = 'left'
      this.ctx.fillText(`${workshop.name} (Lv.${workshop.level})`, upgradeRect.x + 15, upgradeRect.y + 25)
      
      // 升级效果描述
      this.ctx.fillStyle = '#E0E0E0'
      this.ctx.font = '12px Arial'
      const effectDesc = this.getUpgradeEffectDescription(workshop)
      if (effectDesc) {
        this.ctx.fillText(effectDesc, upgradeRect.x + 15, upgradeRect.y + 45)
      }
      
      // 升级费用显示
      this.ctx.font = '14px Arial'
      
      // 金币费用
      this.ctx.fillStyle = canAffordGold ? '#FFD700' : '#FF6B6B'
      this.ctx.fillText(`💰 ${UIUtils.formatNumber(goldCost)} 金币`, upgradeRect.x + 15, upgradeRect.y + 65)
      
      // 宝石费用（如果需要）
      if (gemCost > 0) {
        this.ctx.fillStyle = canAffordGems ? '#FF69B4' : '#FF6B6B'
        this.ctx.fillText(`💎 ${gemCost} 宝石`, upgradeRect.x + 170, upgradeRect.y + 65)
      }
      
      // 保存升级按钮位置
      this.upgradeButtons.push({
        rect: upgradeRect,
        index: index,
        canUpgrade: canUpgrade
      })
      
      currentY += 95
    })
    
    // 关闭按钮
    this.closeButton = {
      x: x + panelWidth - 45,
      y: y + 10,
      width: 35,
      height: 35
    }
    this.renderCloseButton()
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
  
  renderCloseButton() {
    if (!this.closeButton) return
    
    UIUtils.drawRoundRect(this.ctx, this.closeButton, '#FF4444', 12)
    
    // 按钮文字
    this.ctx.fillStyle = '#FFFFFF'
    this.ctx.font = '14px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('✖', this.closeButton.x + this.closeButton.width / 2, this.closeButton.y + this.closeButton.height / 2 + 5)
  }
  
  handleTouch(x, y, gameManager) {
    if (!this.isVisible) return false
    
    // 检查关闭按钮
    if (this.closeButton && UIUtils.isPointInRect(x, y, this.closeButton)) {
      this.hide()
      return true
    }
    
    // 检查升级按钮
    for (const button of this.upgradeButtons) {
      if (UIUtils.isPointInRect(x, y, button.rect) && button.canUpgrade) {
        gameManager.upgradeWorkshop(button.index)
        return true
      }
    }
    
    return true // 阻止点击穿透
  }
}
