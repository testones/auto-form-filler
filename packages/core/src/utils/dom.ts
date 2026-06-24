// ===== packages/core/src/utils/dom.ts =====
// DOM 工具函数

/**
 * 获取元素的唯一 CSS 选择器路径
 */
export function getElementSelector(element: HTMLElement): string {
  if (element.id) return `#${element.id}`;

  const parts: string[] = [];
  let current: HTMLElement | null = element;

  while (current && current !== document.body && current !== document.documentElement) {
    let selector = current.tagName.toLowerCase();

    if (current.id) {
      selector = `#${current.id}`;
      parts.unshift(selector);
      break;
    }

    if (current.className && typeof current.className === 'string') {
      const classes = current.className
        .split(/\s+/)
        .filter((c) => c && !c.startsWith('css-') && !c.match(/^[a-z][a-zA-Z0-9]+$/))
        .slice(0, 2);
      if (classes.length) {
        selector += '.' + classes.join('.');
      }
    }

    // 如果同级有多个相同标签，添加 nth-child
    const parent = current.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(
        (c) => c.tagName === current!.tagName
      );
      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1;
        selector += `:nth-child(${index})`;
      }
    }

    parts.unshift(selector);
    current = current.parentElement;
  }

  return parts.join(' > ');
}

/**
 * 获取元素关联的 label 文本
 */
export function getLabelForElement(element: HTMLElement): string | null {
  // 方式1: <label for="id">
  if (element.id) {
    const label = document.querySelector(`label[for="${element.id}"]`);
    if (label?.textContent) {
      return label.textContent.trim();
    }
  }

  // 方式2: 被 <label> 包裹
  const parentLabel = element.closest('label');
  if (parentLabel?.textContent) {
    return parentLabel.textContent.replace(
      (element as HTMLInputElement).value || '',
      ''
    ).trim();
  }

  // 方式3: 相邻的前一个兄弟是 label
  const prevSibling = element.previousElementSibling;
  if (prevSibling?.tagName === 'LABEL' && prevSibling.textContent) {
    return prevSibling.textContent.trim();
  }

  // 方式4: 父级 form-item 中的 label
  const formItem = element.closest(
    '.ant-form-item, .el-form-item, .arco-form-item, .form-item, .form-group, .profileLib__item, .profile-edit-item, .ivu-form-item, .job-target-edit__item'
  );
  if (formItem) {
    const label = formItem.querySelector(
      '.ant-form-item-label label, .el-form-item__label, .arco-form-item-label, .profileLib__item-label, .profile-edit-item-label, .ivu-form-item-label, .job-target-edit__lab, label, .label'
    );
    if (label?.textContent) {
      return label.textContent.trim();
    }
  }

  // 方式5: 向上查找最近的包含 label 文本的父级容器
  let parent = element.parentElement;
  for (let i = 0; i < 5 && parent; i++) {
    const labelEl = parent.querySelector('.profileLib__item-label, .profile-edit-item-label, .job-target-edit__lab, label, .label, [class*="label"]');
    if (labelEl?.textContent) {
      return labelEl.textContent.trim();
    }
    parent = parent.parentElement;
  }

  return null;
}

/**
 * 判断元素是否可见
 */
export function isElementVisible(element: HTMLElement): boolean {
  const style = window.getComputedStyle(element);
  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.opacity !== '0' &&
    element.offsetWidth > 0 &&
    element.offsetHeight > 0
  );
}

/**
 * 判断元素是否被禁用
 * 注意：readonly 不等于 disabled！
 * DatePicker 的 input 通常是 readonly（通过面板选值），但仍然可以填充
 */
export function isElementDisabled(element: HTMLElement): boolean {
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    // 只检查 disabled，不检查 readOnly
    // DatePicker 的 input 是 readonly 但可以填充
    return element.disabled;
  }
  if (element instanceof HTMLSelectElement) {
    return element.disabled;
  }
  return (
    element.hasAttribute('disabled') ||
    element.getAttribute('aria-disabled') === 'true' ||
    element.classList.contains('is-disabled') ||
    element.classList.contains('ant-select-disabled') ||
    element.classList.contains('ant-picker-disabled') ||
    element.classList.contains('ivu-select-disabled')
  );
}

/**
 * 等待元素出现
 */
export function waitForElement(
  selector: string,
  timeout = 5000,
  root: HTMLElement | Document = document
): Promise<HTMLElement | null> {
  return new Promise((resolve) => {
    const existing = root.querySelector(selector);
    if (existing) {
      resolve(existing as HTMLElement);
      return;
    }

    const observer = new MutationObserver(() => {
      const element = root.querySelector(selector);
      if (element) {
        observer.disconnect();
        clearTimeout(timer);
        resolve(element as HTMLElement);
      }
    });

    observer.observe(root, {
      childList: true,
      subtree: true,
    });

    const timer = setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeout);
  });
}

/**
 * 获取元素的可编辑区域（对于富文本等）
 */
export function getEditableContent(element: HTMLElement): HTMLElement | null {
  // contenteditable
  if (element.isContentEditable) return element;
  const editable = element.querySelector('[contenteditable="true"]');
  if (editable) return editable as HTMLElement;
  return null;
}
