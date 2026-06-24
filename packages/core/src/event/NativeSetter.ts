// ===== packages/core/src/event/NativeSetter.ts =====
/**
 * 原生 Setter 劫持工具
 *
 * 核心原理：
 * React 在挂载时通过 Object.defineProperty 重写了 HTMLInputElement.prototype.value 的 setter，
 * 导致直接 input.value = 'xxx' 无法触发 React 的 onChange 状态更新。
 *
 * 解决方案：
 * 1. 通过 Object.getOwnPropertyDescriptor 获取浏览器原生的 value setter
 * 2. 使用原生 setter 直接设置值（绕过 React 的拦截）
 * 3. 然后 dispatchEvent 触发 input/change 事件通知框架
 */

export class NativeSetter {
  private static nativeInputValueSetter: PropertyDescriptor | null = null;
  private static nativeInputValueGetter: PropertyDescriptor | null = null;
  private static nativeTextareaValueSetter: PropertyDescriptor | null = null;
  private static nativeSelectValueSetter: PropertyDescriptor | null = null;

  /** 获取 HTMLInputElement 的原生 value setter */
  static getInputValueSetter(): PropertyDescriptor {
    if (!this.nativeInputValueSetter) {
      this.nativeInputValueSetter =
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!;
    }
    return this.nativeInputValueSetter;
  }

  /** 获取 HTMLInputElement 的原生 value getter */
  static getInputValueGetter(): PropertyDescriptor {
    if (!this.nativeInputValueGetter) {
      this.nativeInputValueGetter =
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!;
    }
    return this.nativeInputValueGetter;
  }

  /** 获取 HTMLTextAreaElement 的原生 value setter */
  static getTextareaValueSetter(): PropertyDescriptor {
    if (!this.nativeTextareaValueSetter) {
      this.nativeTextareaValueSetter =
        Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!;
    }
    return this.nativeTextareaValueSetter;
  }

  /** 获取 HTMLSelectElement 的原生 value setter */
  static getSelectValueSetter(): PropertyDescriptor {
    if (!this.nativeSelectValueSetter) {
      this.nativeSelectValueSetter =
        Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')!;
    }
    return this.nativeSelectValueSetter;
  }

  /**
   * 使用原生 setter 设置 input/textarea 的值
   * 这是绕过 React 受控组件拦截的核心方法
   */
  static setNativeValue(
    element: HTMLInputElement | HTMLTextAreaElement,
    value: string
  ): void {
    // 判断 React 是否劫持了 value setter
    // 通过比较实例的 setter 和原型上的 setter 是否相同
    const elementSetter = Object.getOwnPropertyDescriptor(element, 'value');
    const prototype = Object.getPrototypeOf(element);
    const prototypeSetter = Object.getOwnPropertyDescriptor(prototype, 'value');

    // 如果实例上有自己的 value 属性描述符，说明 React 劫持了
    if (elementSetter && prototypeSetter && elementSetter.set !== prototypeSetter.set) {
      // 使用原型链上的原生 setter 绕过 React
      prototypeSetter.set!.call(element, value);
    } else if (elementSetter?.set) {
      elementSetter.set.call(element, value);
    } else {
      // 最终兜底：直接通过原型 setter
      if (element instanceof HTMLTextAreaElement) {
        this.getTextareaValueSetter().set!.call(element, value);
      } else {
        this.getInputValueSetter().set!.call(element, value);
      }
    }
  }

  /**
   * 设置 select 元素的 value
   */
  static setSelectValue(
    element: HTMLSelectElement,
    value: string | string[]
  ): void {
    if (Array.isArray(value)) {
      Array.from(element.options).forEach((opt) => {
        opt.selected = value.includes(opt.value);
      });
    } else {
      element.value = value;
    }
  }

  /**
   * 检测元素是否被 React 劫持了 value
   */
  static isReactControlled(element: HTMLInputElement | HTMLTextAreaElement): boolean {
    const elementSetter = Object.getOwnPropertyDescriptor(element, 'value');
    const prototype = Object.getPrototypeOf(element);
    const prototypeSetter = Object.getOwnPropertyDescriptor(prototype, 'value');

    return !!(
      elementSetter &&
      prototypeSetter &&
      elementSetter.set !== prototypeSetter.set
    );
  }

  /**
   * 通过 React 内部 fiber 获取组件实例（高级用法）
   * React 在 DOM 元素上存储了 fiber 引用
   */
  static getReactFiber(element: HTMLElement): unknown | null {
    const key = Object.keys(element).find((k) =>
      k.startsWith('__reactFiber$') || k.startsWith('__reactInternalInstance$')
    );
    return key ? (element as unknown as Record<string, unknown>)[key] : null;
  }

  /**
   * 通过 React fiber 向上查找 stateNode（类组件实例）或 hooks（函数组件）
   */
  static getReactComponentInstance(element: HTMLElement): unknown | null {
    let fiber = this.getReactFiber(element);
    while (fiber) {
      const f = fiber as Record<string, unknown>;
      if (f.stateNode && f.stateNode !== element) {
        return f.stateNode;
      }
      fiber = f.return ?? null;
    }
    return null;
  }
}
