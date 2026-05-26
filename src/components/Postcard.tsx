import { RotateCcw } from "lucide-react";

type PostcardProps = {
  onReplay: () => void;
};

export default function Postcard({ onReplay }: PostcardProps) {
  return (
    <div
      className="postcard-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Romantic postcard"
    >
      <article className="postcard">
        <h1>You are my sunshine</h1>
        <p className="postcard-message">
          В этом мире ничего не происходит просто так.
          <br />
          И наша встреча тоже <br />
          не случайность.
          <br />
          Я безумно рад, что <br/> судьба нас свела.
          <br />
          Ты осветила мою жизнь и подарила тепло.
          <br />
          Вот поэтому ты - моё солнышко ☀️
        </p>
        <button type="button" onClick={onReplay}>
          <RotateCcw size={16} />
          Играть ещё раз.
        </button>
      </article>
    </div>
  );
}
