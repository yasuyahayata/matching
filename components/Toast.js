import { useEffect } from 'react'
import styles from './Toast.module.css'

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 3000) // 3秒後に自動で消える

    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className={`${styles.toast} ${styles[type]}`}>
      <div className={styles.icon}>
        {type === 'success' && '✓'}
        {type === 'error' && '✕'}
        {type === 'info' && 'ℹ'}
      </div>
      <span className={styles.message}>{message}</span>
      <button onClick={onClose} className={styles.closeButton}>
        ×
      </button>
    </div>
  )
}
