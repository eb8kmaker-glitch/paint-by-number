'use client';
import { useForm, ValidationError } from '@formspree/react';

export default function ContactForm() {
  const [state, handleSubmit] = useForm('mgoqdjnr');

  if (state.succeeded) {
    return (
      <div style={{
        padding: '24px',
        background: '#F0FAF0',
        border: '1px solid #86C186',
        borderRadius: '4px',
        textAlign: 'center',
      }}>
        <svg width="32" height="32" fill="none" stroke="#4CAF50" viewBox="0 0 24 24" style={{ margin: '0 auto 12px' }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm font-semibold" style={{ color: '#2D6A2D', marginBottom: '4px' }}>
          메시지가 전송되었습니다
        </p>
        <p className="text-xs" style={{ color: '#4A8A4A' }}>
          Thanks! Your message has been sent.
        </p>
      </div>
    );
  }

  const fieldStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #DDD0BC',
    borderRadius: '3px',
    fontSize: '0.875rem',
    color: 'var(--color-ink)',
    background: '#FDFAF5',
    outline: 'none',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.7rem',
    fontWeight: 600,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    color: 'var(--color-muted)',
    marginBottom: '6px',
  };

  const errorStyle: React.CSSProperties = {
    fontSize: '0.7rem',
    color: '#C0392B',
    marginTop: '4px',
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">

      {/* Name */}
      <div>
        <label htmlFor="name" style={labelStyle}>이름 / Name</label>
        <input
          id="name"
          type="text"
          name="name"
          placeholder="홍길동"
          style={fieldStyle}
        />
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" style={labelStyle}>
          이메일 / Email <span style={{ color: '#C0392B' }}>*</span>
        </label>
        <input
          id="email"
          type="email"
          name="email"
          required
          placeholder="you@example.com"
          style={fieldStyle}
        />
        <ValidationError field="email" prefix="Email" errors={state.errors}
          style={errorStyle} />
      </div>

      {/* Category */}
      <div>
        <label htmlFor="category" style={labelStyle}>문의 유형 / Category</label>
        <select
          id="category"
          name="category"
          style={{ ...fieldStyle, cursor: 'pointer' }}
        >
          <option value="feedback">피드백 / Feedback</option>
          <option value="bug">버그 신고 / Bug Report</option>
          <option value="feature">기능 제안 / Feature Request</option>
          <option value="other">기타 / Other</option>
        </select>
      </div>

      {/* Message */}
      <div>
        <label htmlFor="message" style={labelStyle}>
          메시지 / Message <span style={{ color: '#C0392B' }}>*</span>
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          placeholder="내용을 입력해 주세요..."
          style={{ ...fieldStyle, resize: 'vertical', lineHeight: 1.6 }}
        />
        <ValidationError field="message" prefix="Message" errors={state.errors}
          style={errorStyle} />
      </div>

      {/* Form-level error */}
      {state.errors && Array.isArray(state.errors) && state.errors.length > 0 && (
        <div style={{ padding: '8px 12px', background: '#FDF0EC', border: '1px solid #E08070', borderRadius: '3px', fontSize: '0.75rem', color: '#C0392B' }}>
          전송 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.
        </div>
      )}

      <button
        type="submit"
        disabled={state.submitting}
        className="btn-gallery btn-gold py-3 w-full text-base active:scale-[0.98]"
      >
        {state.submitting ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            전송 중...
          </>
        ) : (
          <>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            보내기 / Send
          </>
        )}
      </button>
    </form>
  );
}
