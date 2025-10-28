import styles from './ConfirmModal.module.css'

export default function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.icon}>⚠️</div>
        <h3 className={styles.title}>確認</h3>
        <p className={styles.message}>{message}</p>
        <div className={styles.buttons}>
          <button onClick={onCancel} className={styles.cancelButton}>
            キャンセル
          </button>
          <button onClick={onConfirm} className={styles.confirmButton}>
            OK
          </button>
        </div>
      </div>
    </div>
  )
}
