import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="ss-footer" role="contentinfo">
      <div className="ss-footer-l">
        <div className="ss-footer-logo">
          Shadow<em>speak</em>
        </div>
        <p>Quiet tools for loud progress.</p>
      </div>

      <div className="ss-footer-cols">
        <div>
          <b>Practice</b>
          <Link href="/lessons?type=shadowing">Shadowing</Link>
          <Link href="/lessons?type=dictation">Dictation</Link>
          <Link href="/lessons?type=speaking">Speaking</Link>
          <Link href="/lessons?type=reading">Reading</Link>
          <Link href="/lessons?type=writing">Writing</Link>
        </div>
        <div>
          <b>Goals</b>
          <Link href="/lessons">IELTS prep</Link>
          <Link href="/lessons">TOEIC prep</Link>
          <Link href="/lessons">Business English</Link>
          <Link href="/lessons">Daily fluency</Link>
        </div>
        <div>
          <b>Account</b>
          <Link href="/progress">Progress</Link>
          <Link href="/login">Sign in</Link>
          <Link href="/register">Get started</Link>
        </div>
      </div>

      <div className="ss-footer-end">
        <span>© {new Date().getFullYear()} ShadowSpeak</span>
        <span>Made for people who&rsquo;d rather speak than scroll.</span>
      </div>
    </footer>
  );
}
