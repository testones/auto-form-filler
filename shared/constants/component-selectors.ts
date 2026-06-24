// ===== auto-form-filler shared/constants/component-selectors.ts =====
// 框架组件 CSS 选择器

/** Ant Design 组件选择器 */
export const ANT_DESIGN_SELECTORS = {
  form: '.ant-form',
  formItem: '.ant-form-item',
  input: '.ant-input',
  textarea: 'textarea.ant-input',
  select: '.ant-select',
  selectSelector: '.ant-select-selector',
  selectDropdown: '.ant-select-dropdown',
  selectOption: '.ant-select-item-option',
  datePicker: '.ant-picker',
  dateCell: '.ant-picker-cell',
  cascader: '.ant-cascader',
  checkbox: '.ant-checkbox',
  checkboxGroup: '.ant-checkbox-group',
  radio: '.ant-radio',
  radioGroup: '.ant-radio-group',
  switch: '.ant-switch',
  upload: '.ant-upload',
  uploadButton: '.ant-upload-select',
  slider: '.ant-slider',
  rate: '.ant-rate',
  treeSelect: '.ant-tree-select',
  mentions: '.ant-mentions',
  autoComplete: '.ant-auto-complete',
  label: '.ant-form-item-label label',
  required: '.ant-form-item-required',
} as const;

/** Element UI / Element Plus 组件选择器 */
export const ELEMENT_UI_SELECTORS = {
  form: '.el-form',
  formItem: '.el-form-item',
  input: '.el-input__inner',
  textarea: '.el-textarea__inner',
  select: '.el-select',
  selectInput: '.el-select .el-input__inner',
  selectDropdown: '.el-select-dropdown',
  selectOption: '.el-select-dropdown__item',
  datePicker: '.el-date-editor',
  dateInput: '.el-date-editor .el-input__inner',
  cascader: '.el-cascader',
  checkbox: '.el-checkbox',
  checkboxGroup: '.el-checkbox-group',
  radio: '.el-radio',
  radioGroup: '.el-radio-group',
  switch: '.el-switch',
  upload: '.el-upload',
  uploadButton: '.el-upload-dragger',
  slider: '.el-slider',
  rate: '.el-rate',
  treeSelect: '.el-tree-select',
  autoComplete: '.el-autocomplete',
  label: '.el-form-item__label',
  required: '.is-required',
} as const;

/** Arco Design 组件选择器 */
export const ARCO_DESIGN_SELECTORS = {
  form: '.arco-form',
  formItem: '.arco-form-item',
  input: '.arco-input',
  select: '.arco-select',
  selectOption: '.arco-select-option',
  datePicker: '.arco-picker',
  cascader: '.arco-cascader',
  checkbox: '.arco-checkbox',
  radio: '.arco-radio',
  switch: '.arco-switch',
  upload: '.arco-upload',
} as const;

/** Material UI 组件选择器 */
export const MATERIAL_UI_SELECTORS = {
  form: '.MuiFormControl-root',
  input: '.MuiInputBase-input',
  select: '.MuiSelect-select',
  selectOption: '.MuiMenuItem-root',
  checkbox: '.MuiCheckbox-root',
  radio: '.MuiRadio-root',
  switch: '.MuiSwitch-root',
  datePicker: '.MuiPickersDay-root',
} as const;

/** 原生 HTML 选择器 */
export const NATIVE_SELECTORS = {
  form: 'form',
  input: 'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"])',
  textarea: 'textarea',
  select: 'select',
  checkbox: 'input[type="checkbox"]',
  radio: 'input[type="radio"]',
  file: 'input[type="file"]',
} as const;

/** 框架检测特征 */
export const FRAMEWORK_DETECTION = {
  react: {
    globalVar: 'React',
    attributePrefix: 'data-react',
    rootId: 'root',
  },
  vue: {
    globalVar: 'Vue',
    attributePrefix: 'data-v-',
    rootSelector: '[data-v-app], #app',
  },
  angular: {
    globalVar: 'ng',
    attributePrefix: '_nghost-',
    rootSelector: '[ng-version]',
  },
} as const;
