<template>
  <div class="price-calc">
    <el-form :model="form" label-width="100px">
      <el-form-item label="书籍原价">
        <el-input 
          v-model.number="form.originalPrice" 
          type="number" 
          min="1" 
          placeholder="请输入书籍原价"
          @change="calcSalePriceHandler"
        />
      </el-form-item>
      <el-form-item label="成色折扣">
        <el-slider 
          v-model="form.discount" 
          :min="0.1" 
          :max="0.9" 
          :step="0.1"
          @change="calcSalePriceHandler"
        />
        <span class="discount-text">当前折扣：{{ Math.round(form.discount * 10) }}折</span>
      </el-form-item>
      <el-form-item label="建议售价">
        <el-tag type="danger" size="large">¥{{ salePrice }}</el-tag>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { ref, watch, defineProps } from 'vue'
import { calcSalePrice } from '../utils/index'

// 接收初始原价
const props = defineProps({
  initOriginalPrice: {
    type: Number,
    default: 0
  }
})

// 表单数据
const form = ref({
  originalPrice: props.initOriginalPrice,
  discount: 0.5 // 默认5折
})

// 建议售价
const salePrice = ref(0)

// 计算售价
const calcSalePriceHandler = () => {
  salePrice.value = calcSalePrice(form.value.originalPrice, form.value.discount)
}

// 初始化计算
calcSalePriceHandler()

// 监听初始值变化
watch(() => props.initOriginalPrice, (val) => {
  form.value.originalPrice = val
  calcSalePriceHandler()
}, { immediate: true })

// 暴露方法供父组件调用
defineExpose({
  form,
  salePrice,
  calcSalePrice: calcSalePriceHandler
})
</script>

<style scoped>
.price-calc {
  padding: 10px;
  border: 1px solid #e6e6e6;
  border-radius: 4px;
  margin: 10px 0;
}
.discount-text {
  margin-left: 10px;
  color: #666;
  font-size: 14px;
}
</style>