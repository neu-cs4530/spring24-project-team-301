export enum Dict {
  Head,
  Description,
  Traditional,
  Western,
}

export type ShogiPieces = {
  K: string;
  // k: string;
  R: string;
  pR: string;
  B: string;
  pB: string;
  G: string;
  S: string;
  pS: string;
  N: string;
  pN: string;
  L: string;
  pL: string;
  P: string;
  pP: string;
};

const PATH = '/assets/Shogi/';
const TRD = 'traditional/';
//const SMP = 'simplified/';
const WST = 'western/';

export const traditionalPieces: ShogiPieces = {
  K: `${PATH}${TRD}Shougi_no_koma_oushou.svg`,
  // k: `${PATH}${TRD}Shougi_no_koma_gyokushou.svg`,
  R: `${PATH}${TRD}Shougi_no_koma_hisha.svg`,
  pR: `${PATH}${TRD}Shougi_no_koma_ryuuou.svg`,
  B: `${PATH}${TRD}Shougi_no_koma_kakugyou.svg`,
  pB: `${PATH}${TRD}Shougi_no_koma_ryuuma.svg`,
  G: `${PATH}${TRD}Shougi_no_koma_kinshou.svg`,
  S: `${PATH}${TRD}Shougi_no_koma_ginshou.svg`,
  pS: `${PATH}${TRD}Shougi_no_koma_narigin.svg`,
  N: `${PATH}${TRD}Shougi_no_koma_keima.svg`,
  pN: `${PATH}${TRD}Shougi_no_koma_narikei.svg`,
  L: `${PATH}${TRD}Shougi_no_koma_kyousha.svg`,
  pL: `${PATH}${TRD}Shougi_no_koma_narikyou.svg`,
  P: `${PATH}${TRD}Shougi_no_koma-fuhyou.svg`,
  pP: `${PATH}${TRD}Shougi_no_koma_tokin.svg`,
};

export const westernPieces: ShogiPieces = {
  K: `${PATH}${WST}Shogi_king_western.svg`,
  // k: `${PATH}${WST}Shogi_king_western.svg`,
  R: `${PATH}${WST}Shogi_rook_western.svg`,
  pR: `${PATH}${WST}Shogi_promoted_rook_western.svg`,
  B: `${PATH}${WST}Shogi_bishop_western.svg`,
  pB: `${PATH}${WST}Shogi_promoted_bishop_western.svg`,
  G: `${PATH}${WST}Shogi_gold_general_western.svg`,
  S: `${PATH}${WST}Shogi_silver_western.svg`,
  pS: `${PATH}${WST}Shogi_promoted_silver_western.svg`,
  N: `${PATH}${WST}Shogi_knight_western.svg`,
  pN: `${PATH}${WST}Shogi_promoted_knight_western.svg`,
  L: `${PATH}${WST}Shogi_lance_western.svg`,
  pL: `${PATH}${WST}Shogi_promoted_lance_western.svg`,
  P: `${PATH}${WST}Shogi_pawn_western.svg`,
  pP: `${PATH}${WST}Shogi_promoted_pawn_western.svg`,
};

export const names: ShogiPieces = {
  K: 'King',
  // k: 'King',
  R: 'Rook',
  pR: 'Dragon',
  B: 'Bishop',
  pB: 'Horse',
  G: 'Gold General',
  S: 'Silver General',
  pS: 'Promoted Silver',
  N: 'Knight',
  pN: 'Promoted Knight',
  L: 'Lance',
  pL: 'Promoted Lance',
  P: 'Pawn',
  pP: 'Tokin',
};

export const descriptions: ShogiPieces = {
  K: 'A king (玉/王) moves one square in any direction, orthogonal or diagonal. ',
  // k: 'A king (玉/王) moves one square in any direction, orthogonal or diagonal. ',
  R: 'A rook (飛) moves any number of squares in an orthogonal direction. ',
  pR: 'A promoted rook ("dragon king", 龍王 ryūō; alternate forms: 龍, 竜) moves as a rook and as a king. It is also called a dragon. ',
  B: "A bishop (角) moves any number of squares in a diagonal direction. Because they cannot move orthogonally, the players' unpromoted bishops can reach only half the squares of the board, unless one is captured and then dropped. ",
  pB: 'A promoted bishop ("dragon horse", 龍馬 ryūma; alternate form: 馬) moves as a bishop and as a king. It is also known as a horse. ',
  G: 'A gold general (金) moves one square orthogonally, or one square diagonally forward, giving it six possible destinations. It cannot move diagonally backwards. ',
  S: 'A silver general (銀) moves one square diagonally, or one square straight forward, giving it five possible destinations. Because an unpromoted silver can retreat more easily than a promoted one, it is common to leave a silver unpromoted at the far side of the board. ',
  pS: 'A promoted silver (成銀 narigin; alternate forms: 全, cursive 金) moves the same way as a gold general.',
  N: 'A knight (桂) jumps at an angle intermediate to orthogonal and diagonal, amounting to one square straight forward plus one square diagonally forward, in a single move.',
  pN: 'A promoted knight (成桂 narikei; alternate forms: 圭, 今, cursive 金) moves the same way as a gold general.',
  L: 'A lance (香) moves just like the rook except it cannot move backwards or to the sides. It is often useful to leave a lance unpromoted at the far side of the board. A lance must promote, however, if it reaches the furthest rank.',
  pL: 'A promoted lance (成香 narikyō; alternate forms: 杏, 仝, cursive 金) moves the same way as a gold general.',
  P: 'A pawn (歩) moves one square straight forward. It cannot retreat. Unlike international chess pawns, shogi pawns capture the same as they move. A pawn must promote if it arrives at the furthest rank. There are two restrictions on where a pawn may be dropped.',
  pP: 'A promoted pawn (と金 tokin; alternate forms: と, 个) all move the same way as a gold general. The promoted pawn is often called by its Japanese name tokin, even by non-Japanese players.',
};
