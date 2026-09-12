import { MathDiagram } from './components/MathGraphic';

export interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  solution: string;
  level?: 'Nhận biết' | 'Thông hiểu' | 'Vận dụng' | 'Vận dụng cao';
  diagram?: MathDiagram;
  tikz?: string;
}

// Utility to dynamically shuffle question options while maintaining correct answer index
export function shuffleQuestionOptions(q: Question): Question {
  const originalCorrectAnswer = q.options[q.correctAnswerIndex];
  const indexedOptions = q.options.map((opt, idx) => ({ opt, originalIndex: idx }));
  
  // Fisher-Yates shuffle
  for (let i = indexedOptions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indexedOptions[i], indexedOptions[j]] = [indexedOptions[j], indexedOptions[i]];
  }
  
  const newOptions = indexedOptions.map(item => item.opt);
  const newCorrectIndex = newOptions.indexOf(originalCorrectAnswer);
  
  return {
    ...q,
    options: newOptions,
    correctAnswerIndex: newCorrectIndex >= 0 ? newCorrectIndex : 0
  };
}

export const questionSets: Question[][] = [
  // =========================================================================
  // BỘ ĐỀ 1: CĂN BẢN VÀ PHÁT TRIỂN (Tính đơn điệu & Cực trị đại số)
  // =========================================================================
  [
    {
      id: 1,
      level: 'Nhận biết',
      question: "Cho hàm số $y = f(x)$ có đạo hàm $f'(x) > 0$ với mọi $x \\in (a; b)$. Khẳng định nào sau đây đúng?",
      options: [
        "Hàm số $y = f(x)$ đồng biến trên khoảng $(a; b)$.",
        "Hàm số $y = f(x)$ nghịch biến trên khoảng $(a; b)$.",
        "Hàm số $y = f(x)$ không đổi trên khoảng $(a; b)$.",
        "Hàm số $y = f(x)$ đạt cực trị tại mọi điểm thuộc $(a; b)$."
      ],
      correctAnswerIndex: 0,
      solution: "Theo định lí về tính đơn điệu của hàm số: Nếu $f'(x) > 0$ với mọi $x \\in (a; b)$ thì hàm số $y = f(x)$ đồng biến trên khoảng $(a; b)$."
    },
    {
      id: 2,
      level: 'Nhận biết',
      question: "Hàm số $y = x^2 - 4x + 3$ đồng biến trên khoảng nào sau đây?",
      options: [
        "$(-\\infty; 2)$",
        "$(2; +\\infty)$",
        "$(-\\infty; 4)$",
        "$(4; +\\infty)$"
      ],
      correctAnswerIndex: 1,
      solution: "Ta có đạo hàm $y' = 2x - 4$. Cho $y' > 0 \\Leftrightarrow 2x - 4 > 0 \\Leftrightarrow x > 2$. Vậy hàm số đồng biến trên $(2; +\\infty)$."
    },
    {
      id: 3,
      level: 'Nhận biết',
      question: "Cho hàm số $y = f(x)$ liên tục trên $\\mathbb{R}$ và có $f'(x)$ đổi dấu từ dương sang âm khi qua điểm $x_0$. Khi đó $x_0$ là:",
      options: [
        "Giá trị cực đại của hàm số.",
        "Điểm cực tiểu của hàm số.",
        "Điểm cực đại của hàm số.",
        "Giá trị cực tiểu của hàm số."
      ],
      correctAnswerIndex: 2,
      solution: "Nếu đạo hàm $f'(x)$ đổi dấu từ dương $(+)$ sang âm $(-)$ khi $x$ đi qua $x_0$ theo chiều tăng dần thì $x_0$ là điểm cực đại của hàm số."
    },
    {
      id: 4,
      level: 'Nhận biết',
      question: "Điểm cực tiểu của đồ thị hàm số $y = x^2 - 2x + 5$ là:",
      options: [
        "Điểm $M(2; 5)$",
        "Điểm $M(-1; 8)$",
        "Điểm $M(1; 0)$",
        "Điểm $M(1; 4)$"
      ],
      correctAnswerIndex: 3,
      solution: "Ta có $y' = 2x - 2 = 0 \\Leftrightarrow x = 1$. Với $x = 1 \\Rightarrow y = 1^2 - 2(1) + 5 = 4$. Vậy điểm cực tiểu của đồ thị là $M(1; 4)$."
    },
    {
      id: 5,
      level: 'Thông hiểu',
      question: "Tìm các khoảng đồng biến của hàm số $y = \\frac{2x - 1}{x + 1}$.",
      options: [
        "$(-\\infty; -1) \\cup (-1; +\\infty)$",
        "$(-\\infty; -1)$ và $(-1; +\\infty)$",
        "$\\mathbb{R} \\setminus \\{-1\\}$",
        "$(-\\infty; +\\infty)$"
      ],
      correctAnswerIndex: 1,
      solution: "Tập xác định $D = \\mathbb{R} \\setminus \\{-1\\}$. Đạo hàm $y' = \\frac{2(1) - (-1)(1)}{(x+1)^2} = \\frac{3}{(x+1)^2} > 0, \\forall x \\neq -1$. Do đó hàm số đồng biến trên các khoảng $(-\\infty; -1)$ và $(-1; +\\infty)$."
    },
    {
      id: 6,
      level: 'Thông hiểu',
      question: "Hàm số $y = -x^3 + 3x^2 - 4$ nghịch biến trên các khoảng nào?",
      options: [
        "$(-\\infty; 0)$ và $(2; +\\infty)$",
        "$(0; 2)$",
        "$(-\\infty; 2)$",
        "$(0; +\\infty)$"
      ],
      correctAnswerIndex: 0,
      solution: "Ta có $y' = -3x^2 + 6x = -3x(x - 2)$. $y' < 0 \\Leftrightarrow x < 0$ hoặc $x > 2$. Vậy hàm số nghịch biến trên $(-\\infty; 0)$ và $(2; +\\infty)$."
    },
    {
      id: 7,
      level: 'Thông hiểu',
      question: "Giá trị cực đại $y_{CĐ}$ của hàm số $y = x^3 - 3x + 2$ bằng:",
      options: [
        "$0$",
        "$-1$",
        "$4$",
        "$1$"
      ],
      correctAnswerIndex: 2,
      solution: "$y' = 3x^2 - 3 = 0 \\Leftrightarrow x = \\pm 1$. $y'$ đổi dấu từ $+$ sang $-$ qua $x = -1$ nên hàm số đạt cực đại tại $x = -1$. Giá trị cực đại $y_{CĐ} = (-1)^3 - 3(-1) + 2 = 4$."
    },
    {
      id: 8,
      level: 'Thông hiểu',
      question: "Số điểm cực trị của hàm số $y = x^4 - 4x^2 + 3$ là:",
      options: [
        "$1$",
        "$2$",
        "$0$",
        "$3$"
      ],
      correctAnswerIndex: 3,
      solution: "$y' = 4x^3 - 8x = 4x(x^2 - 2) = 0 \\Leftrightarrow x = 0$ hoặc $x = \\pm \\sqrt{2}$. Vì $y'$ đổi dấu qua cả 3 nghiệm phân biệt đơn này nên hàm số có 3 điểm cực trị."
    },
    {
      id: 9,
      level: 'Thông hiểu',
      question: "Hàm số $y = \\frac{x^2 - 2x + 5}{x - 1}$ đạt cực đại tại điểm nào?",
      options: [
        "$x = -1$",
        "$x = 3$",
        "$x = 1$",
        "$x = 5$"
      ],
      correctAnswerIndex: 0,
      solution: "$y' = \\frac{(2x-2)(x-1) - (x^2-2x+5)}{(x-1)^2} = \\frac{x^2 - 2x - 3}{(x-1)^2}$. $y' = 0 \\Leftrightarrow x = -1$ hoặc $x = 3$. Qua $x = -1$, $y'$ đổi dấu từ dương sang âm nên $x = -1$ là điểm cực đại."
    },
    {
      id: 10,
      level: 'Vận dụng',
      question: "Tìm khoảng nghịch biến của hàm số $y = \\sqrt{4 - x^2}$.",
      options: [
        "$(-2; 0)$",
        "$(0; 2)$",
        "$(-2; 2)$",
        "$(0; +\\infty)$"
      ],
      correctAnswerIndex: 1,
      solution: "Tập xác định: $[-2; 2]$. Với $x \\in (-2; 2)$, ta có $y' = \\frac{-2x}{2\\sqrt{4 - x^2}} = \\frac{-x}{\\sqrt{4 - x^2}}$. $y' < 0 \\Leftrightarrow x > 0$. Kết hợp với TXĐ suy ra khoảng nghịch biến là $(0; 2)$."
    },
    {
      id: 11,
      level: 'Vận dụng',
      question: "Cho hàm số $y = \\frac{1}{3}x^3 - mx^2 + (m+2)x - 5$. Tìm tất cả các giá trị của tham số $m$ để hàm số luôn đồng biến trên $\\mathbb{R}$.",
      options: [
        "$m \\le -1$ hoặc $m \\ge 2$",
        "$-2 \\le m \\le 1$",
        "$-1 \\le m \\le 2$",
        "$-1 < m < 2$"
      ],
      correctAnswerIndex: 2,
      solution: "$y' = x^2 - 2mx + (m+2)$. Hàm số đồng biến trên $\\mathbb{R} \\Leftrightarrow y' \\ge 0, \\forall x \\in \\mathbb{R} \\Leftrightarrow \\Delta' = m^2 - (m+2) \\le 0 \\Leftrightarrow m^2 - m - 2 \\le 0 \\Leftrightarrow -1 \\le m \\le 2$."
    },
    {
      id: 12,
      level: 'Vận dụng',
      question: "Tìm tất cả các giá trị thực của tham số $m$ để hàm số $y = \\frac{x - m}{x + 1}$ đồng biến trên từng khoảng xác định.",
      options: [
        "$m < -1$",
        "$m \\ge -1$",
        "$m \\le -1$",
        "$m > -1$"
      ],
      correctAnswerIndex: 3,
      solution: "Tập xác định $D = \\mathbb{R} \\setminus \\{-1\\}$. $y' = \\frac{1(1) - (-m)(1)}{(x+1)^2} = \\frac{1+m}{(x+1)^2}$. Hàm số đồng biến trên từng khoảng xác định $\\Leftrightarrow y' > 0, \\forall x \\neq -1 \\Leftrightarrow 1 + m > 0 \\Leftrightarrow m > -1$."
    },
    {
      id: 13,
      level: 'Vận dụng',
      question: "Đường thẳng nối hai điểm cực trị của đồ thị hàm số $y = x^3 - 3x^2 + 2$ có phương trình là:",
      options: [
        "$y = 2x - 2$",
        "$y = -2x + 2$",
        "$y = -2x - 2$",
        "$y = 2x + 2$"
      ],
      correctAnswerIndex: 1,
      solution: "$y' = 3x^2 - 6x = 0 \\Leftrightarrow x = 0$ (ứng với $y = 2$) và $x = 2$ (ứng với $y = -2$). Hai điểm cực trị là $A(0; 2)$ và $B(2; -2)$. Đường thẳng qua $A, B$ có phương trình $y = -2x + 2$."
    },
    {
      id: 14,
      level: 'Vận dụng cao',
      question: "Một chất điểm chuyển động có phương trình $s(t) = t^3 - 9t^2 + 15t$ ($t \\ge 0$, tính bằng giây, $s$ tính bằng mét). Trong khoảng thời gian nào chất điểm chuyển động lùi (vận tốc âm)?",
      options: [
        "$(1; 5)$",
        "$(0; 1)$",
        "$(5; +\\infty)$",
        "$(0; 5)$"
      ],
      correctAnswerIndex: 0,
      solution: "Vận tốc tức thời $v(t) = s'(t) = 3t^2 - 18t + 15$. Chất điểm chuyển động lùi khi $v(t) < 0 \\Leftrightarrow 3(t-1)(t-5) < 0 \\Leftrightarrow 1 < t < 5$. Vậy trong khoảng $(1; 5)$ giây chất điểm chuyển động theo chiều âm."
    },
    {
      id: 15,
      level: 'Vận dụng cao',
      question: "Cho hàm số $y = f(x)$ có đạo hàm $f'(x)$ thỏa mãn $f'(x) < 0$ với mọi $x \\in (-2; 1) \\cup (3; +\\infty)$ và $f'(x) > 0$ với mọi $x \\in (-\\infty; -2) \\cup (1; 3)$. Hàm số $g(x) = f(2 - x)$ đồng biến trên khoảng nào?",
      options: [
        "$(-\\infty; -1)$",
        "$(-1; 1)$",
        "$(1; 4)$",
        "$(4; +\\infty)$"
      ],
      correctAnswerIndex: 2,
      solution: "Ta có $g'(x) = -f'(2-x)$. Để hàm số $g(x)$ đồng biến thì $g'(x) > 0 \\Leftrightarrow f'(2-x) < 0$. Theo giả thiết $f'(u) < 0 \\Leftrightarrow u \\in (-2; 1) \\cup (3; +\\infty)$. Khi $2-x \\in (-2; 1) \\Leftrightarrow -2 < 2-x < 1 \\Leftrightarrow 1 < x < 4$. Do đó $g(x)$ đồng biến trên khoảng $(1; 4)$."
    }
  ],

  // =========================================================================
  // BỘ ĐỀ 2: NÂNG CAO TƯ DUY VÀ ĐỌC ĐỒ THỊ / BẢNG BIẾN THIÊN
  // =========================================================================
  [
    {
      id: 1,
      level: 'Nhận biết',
      question: "Cho hàm số $y = f(x)$ xác định trên $K$. Mệnh đề nào sau đây đúng về định nghĩa hàm số nghịch biến?",
      options: [
        "Với mọi $x_1, x_2 \\in K, x_1 < x_2 \\Rightarrow f(x_1) < f(x_2)$.",
        "Với mọi $x_1, x_2 \\in K, x_1 < x_2 \\Rightarrow f(x_1) = f(x_2)$.",
        "Với mọi $x_1, x_2 \\in K, x_1 < x_2 \\Rightarrow f(x_1) > f(x_2)$.",
        "Với mọi $x_1, x_2 \\in K, f(x_1) > f(x_2) \\Rightarrow x_1 > x_2$."
      ],
      correctAnswerIndex: 2,
      solution: "Định nghĩa SGK: Hàm số $y = f(x)$ nghịch biến trên $K$ nếu với mọi $x_1, x_2 \\in K, x_1 < x_2 \\Rightarrow f(x_1) > f(x_2)$."
    },
    {
      id: 2,
      level: 'Nhận biết',
      question: "Hàm số $y = -x^2 + 6x - 5$ đồng biến trên khoảng nào?",
      options: [
        "$(-\\infty; 3)$",
        "$(3; +\\infty)$",
        "$(-\\infty; 6)$",
        "$(6; +\\infty)$"
      ],
      correctAnswerIndex: 0,
      solution: "$y' = -2x + 6$. $y' > 0 \\Leftrightarrow -2x + 6 > 0 \\Leftrightarrow x < 3$. Vậy hàm số đồng biến trên $(-\\infty; 3)$."
    },
    {
      id: 3,
      level: 'Nhận biết',
      question: "Nếu đạo hàm $f'(x_0) = 0$ và $f'(x)$ không đổi dấu khi $x$ đi qua $x_0$ thì kết luận nào sau đây đúng?",
      options: [
        "$x_0$ chắc chắn là điểm cực đại của hàm số $f(x)$.",
        "$x_0$ chắc chắn là điểm cực tiểu của hàm số $f(x)$.",
        "$x_0$ luôn là điểm cực trị của hàm số.",
        "$x_0$ không phải là điểm cực trị của hàm số $f(x)$."
      ],
      correctAnswerIndex: 3,
      solution: "Theo định lí cực trị: Điểm $x_0$ chỉ là điểm cực trị khi đạo hàm đổi dấu khi qua $x_0$. Nếu $f'(x)$ không đổi dấu thì $x_0$ không là điểm cực trị."
    },
    {
      id: 4,
      level: 'Nhận biết',
      question: "Cho hàm số $y = f(x)$ có bảng biến thiên như hình vẽ dưới đây. Khẳng định nào sau đây đúng?",
      diagram: {
        type: 'bbt',
        title: 'Bảng biến thiên của hàm số y = f(x)',
        xValues: ["-\\infty", "", "1", "", "+\\infty"],
        yPrimeSigns: ["", "+", "0", "-", ""],
        yValues: [
          { val: "-\\infty", pos: 'bottom' },
          { val: "3", pos: 'top' },
          { val: "-\\infty", pos: 'bottom' }
        ]
      },
      options: [
        "Hàm số có giá trị cực tiểu bằng $3$.",
        "Hàm số có giá trị cực đại bằng $3$.",
        "Hàm số đạt cực đại tại $x = 3$.",
        "Hàm số đạt cực tiểu tại $x = 1$."
      ],
      correctAnswerIndex: 1,
      solution: "Tại $x = 1$, đạo hàm $f'(x)$ đổi dấu từ dương sang âm nên $x = 1$ là điểm cực đại và $y_{CĐ} = f(1) = 3$ là giá trị cực đại của hàm số."
    },
    {
      id: 5,
      level: 'Thông hiểu',
      question: "Hàm số $y = \\frac{1}{3}x^3 - x^2 - 3x + 1$ đồng biến trên các khoảng nào?",
      options: [
        "$(-1; 3)$",
        "$(-\\infty; 3)$",
        "$(-\\infty; -1)$ và $(3; +\\infty)$",
        "$(-1; +\\infty)$"
      ],
      correctAnswerIndex: 2,
      solution: "$y' = x^2 - 2x - 3 = (x+1)(x-3)$. $y' > 0 \\Leftrightarrow x < -1$ hoặc $x > 3$. Do đó hàm số đồng biến trên $(-\\infty; -1)$ và $(3; +\\infty)$."
    },
    {
      id: 6,
      level: 'Thông hiểu',
      question: "Cho hàm số $y = -x^4 + 2x^2 + 1$. Hàm số đạt cực đại tại:",
      options: [
        "$x = \\pm 1$",
        "$x = 0$",
        "$x = 1$",
        "$x = 2$"
      ],
      correctAnswerIndex: 0,
      solution: "$y' = -4x^3 + 4x = -4x(x^2 - 1) = 0 \\Leftrightarrow x = 0, x = \\pm 1$. $y'$ đổi dấu từ $+$ sang $-$ khi qua $x = -1$ và $x = 1$. Vậy hàm số đạt cực đại tại $x = \\pm 1$."
    },
    {
      id: 7,
      level: 'Thông hiểu',
      question: "Giá trị cực tiểu $y_{CT}$ của hàm số $y = \\frac{x^2 - 3x + 6}{x - 2}$ bằng:",
      options: [
        "$-3$",
        "$4$",
        "$0$",
        "$5$"
      ],
      correctAnswerIndex: 3,
      solution: "$y' = \\frac{(2x-3)(x-2) - (x^2-3x+6)}{(x-2)^2} = \\frac{x^2 - 4x}{(x-2)^2}$. $y' = 0 \\Leftrightarrow x = 0$ hoặc $x = 4$. Cực tiểu đạt tại $x = 4$, giá trị $y_{CT} = \\frac{4^2 - 3(4) + 6}{4 - 2} = \\frac{10}{2} = 5$."
    },
    {
      id: 8,
      level: 'Thông hiểu',
      question: "Trong các hàm số sau, hàm số nào luôn đồng biến trên toàn bộ $\\mathbb{R}$?",
      options: [
        "$y = x^3 - 3x + 1$",
        "$y = x^3 + 2x - 1$",
        "$y = \\frac{x - 1}{x + 2}$",
        "$y = x^4 + x^2$"
      ],
      correctAnswerIndex: 1,
      solution: "Xét $y = x^3 + 2x - 1$ có $y' = 3x^2 + 2 > 0, \\forall x \\in \\mathbb{R}$. Vậy hàm số này luôn đồng biến trên $\\mathbb{R}$."
    },
    {
      id: 9,
      level: 'Thông hiểu',
      question: "Tìm các điểm cực trị của hàm số $y = x^3 - 3x^2 + 2$.",
      options: [
        "$x = 0$ và $x = 2$",
        "$x = -1$ và $x = 1$",
        "$x = 2$ và $x = -2$",
        "$x = 0$ và $x = -2$"
      ],
      correctAnswerIndex: 0,
      solution: "$y' = 3x^2 - 6x = 3x(x - 2) = 0 \\Leftrightarrow x = 0$ hoặc $x = 2$. Cả hai nghiệm này đều làm đạo hàm đổi dấu nên hàm số có 2 điểm cực trị là $x = 0$ và $x = 2$."
    },
    {
      id: 10,
      level: 'Vận dụng',
      question: "Cho hàm số $y = \\sqrt{2x - x^2}$. Điểm cực đại của hàm số là:",
      options: [
        "$x = 0$",
        "$x = 2$",
        "$x = 1$",
        "$x = \\frac{1}{2}$"
      ],
      correctAnswerIndex: 2,
      solution: "TXĐ: $[0; 2]$. Với $x \\in (0; 2)$, $y' = \\frac{1 - x}{\\sqrt{2x - x^2}} = 0 \\Leftrightarrow x = 1$. $y'$ đổi dấu từ $+$ sang $-$ qua $x = 1$. Vậy $x = 1$ là điểm cực đại."
    },
    {
      id: 11,
      level: 'Vận dụng',
      question: "Tìm tất cả các giá trị thực của tham số $m$ để hàm số $y = -x^3 + 3x^2 + 3mx - 1$ nghịch biến trên khoảng $(0; +\\infty)$.",
      options: [
        "$m \\ge 1$",
        "$m < 0$",
        "$m \\le 0$",
        "$m \\le -1$"
      ],
      correctAnswerIndex: 3,
      solution: "$y' = -3x^2 + 6x + 3m$. Hàm số nghịch biến trên $(0; +\\infty) \\Leftrightarrow y' \\le 0, \\forall x > 0 \\Leftrightarrow 3m \\le 3x^2 - 6x, \\forall x > 0 \\Leftrightarrow m \\le x^2 - 2x, \\forall x > 0$. Ta có $\\min_{(0;+\\infty)} (x^2 - 2x) = -1$ tại $x = 1$. Do đó $m \\le -1$."
    },
    {
      id: 12,
      level: 'Vận dụng',
      question: "Hàm số trùng phương $y = x^4 - 2mx^2 + 3$ có đúng một điểm cực trị khi và chỉ khi:",
      options: [
        "$m < 0$",
        "$m \\le 0$",
        "$m \\ge 0$",
        "$m > 0$"
      ],
      correctAnswerIndex: 1,
      solution: "$y' = 4x^3 - 4mx = 4x(x^2 - m)$. Hàm số có đúng một điểm cực trị $\\Leftrightarrow x^2 = m$ vô nghiệm hoặc có nghiệm $x = 0 \\Leftrightarrow m \\le 0$."
    },
    {
      id: 13,
      level: 'Vận dụng',
      question: "Khoảng cách giữa hai điểm cực trị của đồ thị hàm số $y = x^3 - 3x + 1$ bằng:",
      options: [
        "$2\\sqrt{5}$",
        "$4$",
        "$2\\sqrt{3}$",
        "$\\sqrt{17}$"
      ],
      correctAnswerIndex: 0,
      solution: "$y' = 3x^2 - 3 = 0 \\Leftrightarrow x = 1$ ($y = -1$) và $x = -1$ ($y = 3$). Hai điểm cực trị là $A(1; -1)$ và $B(-1; 3)$. Khoảng cách $AB = \\sqrt{(-1-1)^2 + (3 - (-1))^2} = \\sqrt{4 + 16} = 2\\sqrt{5}$."
    },
    {
      id: 14,
      level: 'Vận dụng cao',
      question: "Một công ty dự báo số lượng tiêu thụ sản phẩm theo thời gian $t$ (tháng) tuân theo công thức $S(t) = \\frac{100t}{t^2 + 4}$ ($t \\ge 0$). Sau bao nhiêu tháng thì sản lượng tiêu thụ trong tháng đạt cực đại?",
      options: [
        "$4$ tháng",
        "$1$ tháng",
        "$2$ tháng",
        "$3$ tháng"
      ],
      correctAnswerIndex: 2,
      solution: "Xét $S'(t) = \\frac{100(t^2+4) - 100t(2t)}{(t^2+4)^2} = \\frac{400 - 100t^2}{(t^2+4)^2}$. Cho $S'(t) = 0 \\Leftrightarrow 400 - 100t^2 = 0 \\Leftrightarrow t = 2$ (do $t \\ge 0$). BBT cho thấy $S(t)$ đạt giá trị cực đại tại $t = 2$ tháng."
    },
    {
      id: 15,
      level: 'Vận dụng cao',
      question: "Cho hàm số $y = f(x)$ có đạo hàm $f'(x) = (x+1)^2(x-2)^3(x-4)$. Số điểm cực trị của hàm số $g(x) = f(x^2)$ là:",
      options: [
        "$3$",
        "$5$",
        "$4$",
        "$7$"
      ],
      correctAnswerIndex: 1,
      solution: "Ta có $g'(x) = 2x \\cdot f'(x^2) = 2x \\cdot (x^2+1)^2 \\cdot (x^2-2)^3 \\cdot (x^2-4)$. Các nhân tử đổi dấu gồm: $2x$ đổi dấu qua $x = 0$; $(x^2-2)^3$ đổi dấu qua $x = \\pm \\sqrt{2}$; $(x^2-4)$ đổi dấu qua $x = \\pm 2$. Tất cả 5 nghiệm này đều phân biệt và là nghiệm bội lẻ, do đó $g'(x)$ đổi dấu tại đúng 5 điểm $\\Rightarrow$ có 5 điểm cực trị."
    }
  ],

  // =========================================================================
  // BỘ ĐỀ 3: TƯ DUY ĐẠO HÀM VÀ HÀM PHÂN THỨC HỮU TỈ
  // =========================================================================
  [
    {
      id: 1,
      level: 'Nhận biết',
      question: "Đạo hàm của hàm số $y = x^3 - 6x^2 + 9x - 2$ là biểu thức nào sau đây?",
      options: [
        "$y' = 3x^2 - 6x + 9$",
        "$y' = 3x^2 - 12x + 9$",
        "$y' = 3x^2 - 12x$",
        "$y' = x^2 - 4x + 3$"
      ],
      correctAnswerIndex: 1,
      solution: "Áp dụng công thức tính đạo hàm $(x^n)' = n x^{n-1}$, ta có $y' = 3x^2 - 12x + 9$."
    },
    {
      id: 2,
      level: 'Nhận biết',
      question: "Hàm số nào sau đây luôn nghịch biến trên toàn trục số $\\mathbb{R}$?",
      options: [
        "$y = -x^3 + 3x - 1$",
        "$y = -x^4 - x^2$",
        "$y = \\frac{-x + 1}{x + 2}$",
        "$y = -x^3 - 3x + 1$"
      ],
      correctAnswerIndex: 3,
      solution: "Xét $y = -x^3 - 3x + 1$ có đạo hàm $y' = -3x^2 - 3 = -3(x^2 + 1) < 0, \\forall x \\in \\mathbb{R}$. Do đó hàm số này nghịch biến trên $\\mathbb{R}$."
    },
    {
      id: 3,
      level: 'Nhận biết',
      question: "Cho hàm số $y = f(x)$ có bảng biến thiên như hình vẽ dưới đây. Điểm cực tiểu của hàm số là:",
      diagram: {
        type: 'bbt',
        title: 'Bảng biến thiên của hàm số y = f(x)',
        xValues: ["-\\infty", "", "-2", "", "3", "", "+\\infty"],
        yPrimeSigns: ["", "-", "0", "+", "0", "-", ""],
        yValues: [
          { val: "+\\infty", pos: 'top' },
          { val: "-5", pos: 'bottom' },
          { val: "7", pos: 'top' },
          { val: "-\\infty", pos: 'bottom' }
        ]
      },
      options: [
        "$x = -2$",
        "$x = 3$",
        "$x = -5$",
        "$x = 7$"
      ],
      correctAnswerIndex: 0,
      solution: "Đạo hàm đổi dấu từ âm sang dương khi qua $x = -2$ nên $x = -2$ là điểm cực tiểu của hàm số."
    },
    {
      id: 4,
      level: 'Nhận biết',
      question: "Đồ thị hàm số phân thức bậc nhất trên bậc nhất $y = \\frac{ax + b}{cx + d}$ ($ad - bc \\neq 0, c \\neq 0$) có bao nhiêu điểm cực trị?",
      options: [
        "$1$",
        "$2$",
        "$0$",
        "$3$"
      ],
      correctAnswerIndex: 2,
      solution: "Vì đạo hàm $y' = \\frac{ad - bc}{(cx + d)^2}$ luôn cùng dấu trên từng khoảng xác định và không đổi dấu qua nghiệm nào nên hàm số không có điểm cực trị ($0$ điểm cực trị)."
    },
    {
      id: 5,
      level: 'Thông hiểu',
      question: "Hàm số $y = \\frac{x + 3}{1 - x}$ đồng biến trên các khoảng nào?",
      options: [
        "$(-\\infty; 1)$ và $(1; +\\infty)$",
        "$(-\\infty; -3)$ và $(-3; +\\infty)$",
        "$(-3; 1)$",
        "$\\mathbb{R} \\setminus \\{1\\}$"
      ],
      correctAnswerIndex: 0,
      solution: "Viết lại $y = \\frac{x+3}{-x+1}$, TXĐ $D = \\mathbb{R} \\setminus \\{1\\}$. Đạo hàm $y' = \\frac{1(1) - 3(-1)}{(1-x)^2} = \\frac{4}{(1-x)^2} > 0, \\forall x \\neq 1$. Hàm số đồng biến trên $(-\\infty; 1)$ và $(1; +\\infty)$."
    },
    {
      id: 6,
      level: 'Thông hiểu',
      question: "Hàm số $y = x^3 - 6x^2 + 9x + 1$ đạt cực tiểu tại điểm nào?",
      options: [
        "$x = 1$",
        "$x = 3$",
        "$x = 0$",
        "$x = 9$"
      ],
      correctAnswerIndex: 1,
      solution: "$y' = 3x^2 - 12x + 9 = 3(x-1)(x-3) = 0 \\Leftrightarrow x = 1$ hoặc $x = 3$. Qua $x = 3$, $y'$ đổi dấu từ $-$ sang $+$ nên $x = 3$ là điểm cực tiểu."
    },
    {
      id: 7,
      level: 'Thông hiểu',
      question: "Tìm giá trị cực đại $y_{CĐ}$ của hàm số $y = -x^3 + 3x^2 + 9x - 2$.",
      options: [
        "$-7$",
        "$3$",
        "$0$",
        "$25$"
      ],
      correctAnswerIndex: 3,
      solution: "$y' = -3x^2 + 6x + 9 = 0 \\Leftrightarrow x = -1$ hoặc $x = 3$. Đạt cực đại tại $x = 3$, giá trị cực đại $y(3) = -27 + 27 + 27 - 2 = 25$."
    },
    {
      id: 8,
      level: 'Thông hiểu',
      question: "Hàm số $y = x^4 - 2x^2 + 2$ nghịch biến trên các khoảng nào?",
      options: [
        "$(-1; 0)$ và $(1; +\\infty)$",
        "$(-1; 1)$",
        "$(-\\infty; -1)$ và $(0; 1)$",
        "$(-\\infty; 0)$"
      ],
      correctAnswerIndex: 2,
      solution: "$y' = 4x^3 - 4x = 4x(x-1)(x+1)$. Bảng xét dấu cho thấy $y' < 0$ khi $x \\in (-\\infty; -1)$ và $x \\in (0; 1)$."
    },
    {
      id: 9,
      level: 'Thông hiểu',
      question: "Hàm số $y = \\frac{x^2 - x + 1}{x - 1}$ đồng biến trên các khoảng nào?",
      options: [
        "$(-\\infty; 0)$ và $(2; +\\infty)$",
        "$(0; 1)$ và $(1; 2)$",
        "$(0; 2)$",
        "$(-\\infty; 1)$ và $(1; +\\infty)$"
      ],
      correctAnswerIndex: 0,
      solution: "$y = x + \\frac{1}{x-1} \\Rightarrow y' = 1 - \\frac{1}{(x-1)^2} = \\frac{x^2 - 2x}{(x-1)^2}$. $y' > 0 \\Leftrightarrow x < 0$ hoặc $x > 2$."
    },
    {
      id: 10,
      level: 'Vận dụng',
      question: "Tìm giá trị của tham số $m$ để hàm số $y = x^3 - 3x^2 + mx - 5$ đạt cực trị tại điểm $x = 2$.",
      options: [
        "$m = 3$",
        "$m = -3$",
        "$m = 12$",
        "$m = 0$"
      ],
      correctAnswerIndex: 3,
      solution: "$y' = 3x^2 - 6x + m$. Hàm số đạt cực trị tại $x = 2 \\Rightarrow y'(2) = 0 \\Leftrightarrow 3(4) - 6(2) + m = 0 \\Leftrightarrow m = 0$."
    },
    {
      id: 11,
      level: 'Vận dụng',
      question: "Tìm tất cả các giá trị của tham số $m$ để hàm số $y = \\frac{mx + 4}{x + m}$ nghịch biến trên từng khoảng xác định.",
      options: [
        "$m < -2$ hoặc $m > 2$",
        "$-2 < m < 2$",
        "$-2 \\le m \\le 2$",
        "$m > 2$"
      ],
      correctAnswerIndex: 1,
      solution: "TXĐ: $D = \\mathbb{R} \\setminus \\{-m\\}$. $y' = \\frac{m^2 - 4}{(x+m)^2}$. Hàm số nghịch biến $\\Leftrightarrow y' < 0, \\forall x \\neq -m \\Leftrightarrow m^2 - 4 < 0 \\Leftrightarrow -2 < m < 2$."
    },
    {
      id: 12,
      level: 'Vận dụng',
      question: "Hàm số $y = \\sin x - x$ trên đoạn $[0; 2\\pi]$ có tính chất gì?",
      options: [
        "Đồng biến trên đoạn $[0; 2\\pi]$.",
        "Đạt cực đại tại $x = \\pi$.",
        "Nghịch biến trên đoạn $[0; 2\\pi]$.",
        "Không đơn điệu trên $[0; 2\\pi]$."
      ],
      correctAnswerIndex: 2,
      solution: "Ta có $y' = \\cos x - 1 \\le 0, \\forall x \\in [0; 2\\pi]$. Dấu '=' chỉ xảy ra tại các điểm rời rạc $x = 0, 2\\pi$. Do đó hàm số nghịch biến trên đoạn $[0; 2\\pi]$."
    },
    {
      id: 13,
      level: 'Vận dụng',
      question: "Tổng tung độ các điểm cực trị của đồ thị hàm số $y = -x^3 + 3x + 2$ là:",
      options: [
        "$4$",
        "$2$",
        "$0$",
        "$-2$"
      ],
      correctAnswerIndex: 0,
      solution: "$y' = -3x^2 + 3 = 0 \\Leftrightarrow x = \\pm 1$. Với $x = 1 \\Rightarrow y_1 = 4$. Với $x = -1 \\Rightarrow y_2 = 0$. Tổng tung độ: $y_1 + y_2 = 4 + 0 = 4$."
    },
    {
      id: 14,
      level: 'Vận dụng cao',
      question: "Số dân của một xã sau $t$ năm kể từ năm 2020 được ước tính theo công thức $N(t) = \\frac{20t + 10}{t + 1}$ (nghìn người, $t \\ge 0$). Khẳng định nào sau đây đúng về sự biến thiên dân số?",
      options: [
        "Dân số luôn giảm dần theo thời gian.",
        "Dân số luôn tăng theo thời gian và tiệm cận mức 20 nghìn người.",
        "Dân số đạt mức cực đại sau 5 năm.",
        "Dân số tăng vô hạn khi $t \\to +\\infty$."
      ],
      correctAnswerIndex: 1,
      solution: "Ta có $N'(t) = \\frac{20(1) - 10(1)}{(t+1)^2} = \\frac{10}{(t+1)^2} > 0, \\forall t \\ge 0$. Do đó dân số luôn tăng theo thời gian. Mặt khác $\\lim_{t \\to +\\infty} N(t) = 20$ (nghìn người)."
    },
    {
      id: 15,
      level: 'Vận dụng cao',
      question: "Cho hàm số $y = f(x)$ có bảng xét dấu của đạo hàm $f'(x)$: $f'(x) > 0$ trên $(-3; -1)$ và $(2; +\\infty)$; $f'(x) < 0$ trên $(-\\infty; -3)$ và $(-1; 2)$. Hàm số $g(x) = f(x^2 - 2)$ nghịch biến trên khoảng nào sau đây?",
      options: [
        "$(0; 1)$",
        "$(-\\infty; -2)$",
        "$(2; +\\infty)$",
        "$(1; 2)$"
      ],
      correctAnswerIndex: 3,
      solution: "$g'(x) = 2x \\cdot f'(x^2 - 2)$. Xét trên khoảng $(1; 2)$, ta có $2x > 0$. Khi $x \\in (1; 2) \\Rightarrow x^2 - 2 \\in (-1; 2)$, trên khoảng này $f'(u) < 0$. Do đó $g'(x) = 2x \\cdot f'(x^2 - 2) < 0$, suy ra $g(x)$ nghịch biến trên $(1; 2)$."
    }
  ],

  // =========================================================================
  // BỘ ĐỀ 4: CỰC TRỊ VÀ BÀI TOÁN THỰC TẾ SGK KẾT NỐI TRI THỨC
  // =========================================================================
  [
    {
      id: 1,
      level: 'Nhận biết',
      question: "Nếu hàm số $y = f(x)$ đồng biến trên $(a; b)$ thì đồ thị của nó trên khoảng đó có hướng biểu diễn hình học như thế nào?",
      options: [
        "Đi xuống từ trái sang phải.",
        "Đi ngang song song với trục hoành.",
        "Uốn lượn đối xứng qua gốc tọa độ.",
        "Đi lên từ trái sang phải."
      ],
      correctAnswerIndex: 3,
      solution: "Đặc điểm hình học: Đồ thị của hàm số đồng biến trên một khoảng sẽ có hướng đi lên từ trái sang phải."
    },
    {
      id: 2,
      level: 'Nhận biết',
      question: "Hàm số $y = x^3 - 3x^2$ có các điểm cực trị là nghiệm của phương trình nào sau đây?",
      options: [
        "$3x^2 - 6x = 0$",
        "$3x^2 - 3 = 0$",
        "$x^2 - 3x = 0$",
        "$3x^2 + 6x = 0$"
      ],
      correctAnswerIndex: 0,
      solution: "Các điểm cực trị của hàm đa thức là nghiệm của phương trình đạo hàm $y' = 0 \\Leftrightarrow 3x^2 - 6x = 0$."
    },
    {
      id: 3,
      level: 'Nhận biết',
      question: "Cho hàm số $y = f(x)$ có bảng biến thiên như hình vẽ dưới đây. Giá trị cực tiểu $y_{CT}$ của hàm số là:",
      diagram: {
        type: 'bbt',
        title: 'Bảng biến thiên của hàm số y = f(x)',
        xValues: ["-\\infty", "", "0", "", "2", "", "+\\infty"],
        yPrimeSigns: ["", "+", "0", "-", "0", "+", ""],
        yValues: [
          { val: "-\\infty", pos: 'bottom' },
          { val: "2", pos: 'top' },
          { val: "-2", pos: 'bottom' },
          { val: "+\\infty", pos: 'top' }
        ]
      },
      options: [
        "$2$",
        "$0$",
        "$-2$",
        "Không tồn tại"
      ],
      correctAnswerIndex: 2,
      solution: "Dựa vào bảng biến thiên, tại điểm cực tiểu $x = 2$, giá trị cực tiểu tương ứng của hàm số là $y_{CT} = -2$."
    },
    {
      id: 4,
      level: 'Nhận biết',
      question: "Hàm số $y = -x^4 - 2x^2 + 3$ có bao nhiêu điểm cực đại?",
      options: [
        "$0$",
        "$1$",
        "$2$",
        "$3$"
      ],
      correctAnswerIndex: 1,
      solution: "$y' = -4x^3 - 4x = -4x(x^2 + 1) = 0 \\Leftrightarrow x = 0$. $y'$ đổi dấu từ $+$ sang $-$ qua $x = 0$, nên hàm số có đúng $1$ điểm cực đại tại $x = 0$."
    },
    {
      id: 5,
      level: 'Thông hiểu',
      question: "Tìm khoảng đồng biến của hàm số $y = -x^3 + 12x + 1$.",
      options: [
        "$(-\\infty; -2)$ và $(2; +\\infty)$",
        "$(-\\infty; 2)$",
        "$(-2; +\\infty)$",
        "$(-2; 2)$"
      ],
      correctAnswerIndex: 3,
      solution: "$y' = -3x^2 + 12 = -3(x^2 - 4)$. $y' > 0 \\Leftrightarrow x^2 - 4 < 0 \\Leftrightarrow -2 < x < 2$."
    },
    {
      id: 6,
      level: 'Thông hiểu',
      question: "Đồ thị hàm số $y = x^3 - 3x^2 + 4$ có điểm cực đại là tọa độ nào?",
      options: [
        "$(0; 4)$",
        "$(2; 0)$",
        "$(0; 0)$",
        "$(2; 4)$"
      ],
      correctAnswerIndex: 0,
      solution: "$y' = 3x^2 - 6x = 0 \\Leftrightarrow x = 0$ hoặc $x = 2$. Tại $x = 0 \\Rightarrow y = 4$, đạo hàm đổi dấu từ dương sang âm nên điểm cực đại của đồ thị là $(0; 4)$."
    },
    {
      id: 7,
      level: 'Thông hiểu',
      question: "Hàm số $y = \\frac{x^2 - 4x + 8}{x - 2}$ nghịch biến trên các khoảng nào?",
      options: [
        "$(0; 4)$",
        "$(0; 2)$ và $(2; 4)$",
        "$(-\\infty; 0)$ và $(4; +\\infty)$",
        "$(-\\infty; 2)$ và $(2; +\\infty)$"
      ],
      correctAnswerIndex: 1,
      solution: "$y = x - 2 + \\frac{4}{x-2} \\Rightarrow y' = 1 - \\frac{4}{(x-2)^2} = \\frac{x^2 - 4x}{(x-2)^2}$. $y' < 0 \\Leftrightarrow 0 < x < 4$ và $x \\neq 2$."
    },
    {
      id: 8,
      level: 'Thông hiểu',
      question: "Điểm cực tiểu của hàm số $y = x + \\frac{4}{x}$ trên khoảng $(0; +\\infty)$ là:",
      options: [
        "$x = -2$",
        "$x = 4$",
        "$x = 2$",
        "$x = 1$"
      ],
      correctAnswerIndex: 2,
      solution: "Với $x > 0, y' = 1 - \\frac{4}{x^2} = 0 \\Leftrightarrow x = 2$. $y'$ đổi dấu từ âm sang dương qua $x = 2$ nên $x = 2$ là điểm cực tiểu."
    },
    {
      id: 9,
      level: 'Thông hiểu',
      question: "Hàm số $y = x^4 + 4x^2 + 1$ đạt cực tiểu tại:",
      options: [
        "$x = 0$",
        "$x = -2$",
        "$x = 2$",
        "$x = \\pm 2$"
      ],
      correctAnswerIndex: 0,
      solution: "$y' = 4x^3 + 8x = 4x(x^2 + 2) = 0 \\Leftrightarrow x = 0$. $y'$ đổi dấu từ âm sang dương qua $x = 0$ nên $x = 0$ là điểm cực tiểu."
    },
    {
      id: 10,
      level: 'Vận dụng',
      question: "Hàm số $y = \\sqrt{x^2 - 6x + 10}$ đồng biến trên khoảng nào?",
      options: [
        "$(-\\infty; 3)$",
        "$(-\\infty; +\\infty)$",
        "$(0; 3)$",
        "$(3; +\\infty)$"
      ],
      correctAnswerIndex: 3,
      solution: "Biểu thức $x^2 - 6x + 10 = (x-3)^2 + 1 > 0, \\forall x$. Đạo hàm $y' = \\frac{2x - 6}{2\\sqrt{x^2 - 6x + 10}} = \\frac{x - 3}{\\sqrt{x^2 - 6x + 10}}$. $y' > 0 \\Leftrightarrow x > 3$."
    },
    {
      id: 11,
      level: 'Vận dụng',
      question: "Tìm $m$ để hàm số $y = x^3 - 3mx^2 + 3(m^2 - 1)x + 1$ có hai điểm cực trị $x_1, x_2$ thỏa mãn $x_1^2 + x_2^2 = 6$.",
      options: [
        "$m = \\pm 1$",
        "$m = \\pm \\sqrt{2}$",
        "$m = 0$",
        "$m = \\pm 2$"
      ],
      correctAnswerIndex: 1,
      solution: "$y' = 3[x^2 - 2mx + (m^2 - 1)] = 0$. Hai nghiệm thỏa mãn: $x_1 + x_2 = 2m, x_1 x_2 = m^2 - 1$. Ta có $x_1^2 + x_2^2 = (2m)^2 - 2(m^2 - 1) = 2m^2 + 2 = 6 \\Leftrightarrow 2m^2 = 4 \\Leftrightarrow m = \\pm \\sqrt{2}$."
    },
    {
      id: 12,
      level: 'Vận dụng',
      question: "Số điểm cực trị của hàm số $y = |x^3 - 3x|$ là:",
      options: [
        "$3$",
        "$2$",
        "$5$",
        "$4$"
      ],
      correctAnswerIndex: 2,
      solution: "Đồ thị $g(x) = x^3 - 3x$ có 2 điểm cực trị và cắt trục hoành tại 3 điểm phân biệt $x = 0, x = \\pm \\sqrt{3}$. Do đó hàm trị tuyệt đối $y = |g(x)|$ có tổng số điểm cực trị bằng $2 + 3 = 5$."
    },
    {
      id: 13,
      level: 'Vận dụng',
      question: "Tìm giá trị của tham số $m$ để hàm số $y = \\frac{x^2 - 2mx + 2}{x - 1}$ đạt cực đại tại điểm $x = 0$.",
      options: [
        "$m = 1$",
        "$m = 0$",
        "$m = -1$",
        "$m = 2$"
      ],
      correctAnswerIndex: 0,
      solution: "$y' = \\frac{(2x-2m)(x-1) - (x^2-2mx+2)}{(x-1)^2} = \\frac{x^2 - 2x + 2m - 2}{(x-1)^2}$. Đạt cực trị tại $x = 0 \\Rightarrow y'(0) = 0 \\Leftrightarrow 2m - 2 = 0 \\Leftrightarrow m = 1$. Khi $m = 1$, $y'$ đổi dấu từ dương sang âm qua $x = 0$ (thỏa mãn cực đại)."
    },
    {
      id: 14,
      level: 'Vận dụng cao',
      question: "Một công ty sản xuất bóng đèn có hàm chi phí $C(x) = 2x + 50$ (triệu đồng) để sản xuất $x$ nghìn bóng đèn. Chi phí trung bình cho mỗi nghìn bóng đèn là $f(x) = \\frac{C(x)}{x} = 2 + \\frac{50}{x}$ ($x > 0$). Khẳng định nào sau đây đúng?",
      options: [
        "Chi phí trung bình luôn tăng khi mở rộng quy mô $x$.",
        "Chi phí trung bình đạt giá trị nhỏ nhất khi $x = 25$.",
        "Chi phí trung bình không đổi theo $x$.",
        "Chi phí trung bình $f(x)$ luôn giảm dần khi quy mô sản xuất $x$ tăng."
      ],
      correctAnswerIndex: 3,
      solution: "Ta có $f'(x) = -\\frac{50}{x^2} < 0, \\forall x > 0$. Do đó hàm số $f(x)$ nghịch biến trên $(0; +\\infty)$, tức chi phí trung bình luôn giảm dần khi số lượng sản phẩm tăng (tính kinh tế theo quy mô)."
    },
    {
      id: 15,
      level: 'Vận dụng cao',
      question: "Một vật được ném thẳng đứng lên cao từ mặt đất với phương trình chuyển động $h(t) = 24,5t - 4,9t^2$ (mét, $t \\ge 0$ tính bằng giây). Độ cao lớn nhất mà vật đạt được là bao nhiêu?",
      options: [
        "$24,5\\text{ m}$",
        "$30,625\\text{ m}$",
        "$32,5\\text{ m}$",
        "$29,4\\text{ m}$"
      ],
      correctAnswerIndex: 1,
      solution: "Vận tốc tức thời $v(t) = h'(t) = 24,5 - 9,8t$. Độ cao đạt cực đại khi $v(t) = 0 \\Leftrightarrow t = \\frac{24,5}{9,8} = 2,5$ giây. Khi đó $h(2,5) = 24,5(2,5) - 4,9(2,5)^2 = 30,625\\text{ m}$."
    }
  ],

  // =========================================================================
  // BỘ ĐỀ 5: TỔNG HỢP VÀ THỰC TIỄN GDPT 2018 (Toán học 12 KNTT)
  // =========================================================================
  [
    {
      id: 1,
      level: 'Nhận biết',
      question: "Nếu hàm số $y = f(x)$ có $f'(x) < 0$ với mọi $x \\in (1; 4)$ thì trên khoảng $(1; 4)$:",
      options: [
        "Hàm số đồng biến.",
        "Hàm số không đổi.",
        "Hàm số nghịch biến.",
        "Hàm số có cực trị tại $x = 2,5$."
      ],
      correctAnswerIndex: 2,
      solution: "Theo định lí dấu đạo hàm, nếu $f'(x) < 0$ trên một khoảng thì hàm số nghịch biến trên khoảng đó."
    },
    {
      id: 2,
      level: 'Nhận biết',
      question: "Hàm số bậc hai $y = -2x^2 + 4x + 1$ có điểm cực đại là:",
      options: [
        "$x = -1$",
        "$x = 1$",
        "$x = 2$",
        "$x = 3$"
      ],
      correctAnswerIndex: 1,
      solution: "$y' = -4x + 4 = 0 \\Leftrightarrow x = 1$. Vì hệ số $a = -2 < 0$ nên parabol đạt cực đại tại đỉnh $x = 1$."
    },
    {
      id: 3,
      level: 'Nhận biết',
      question: "Khái niệm 'Điểm cực đại của hàm số $y = f(x)$' trong SGK chỉ:",
      options: [
        "Giá trị của biến số $x_0$ mà tại đó hàm số đạt cực đại.",
        "Giá trị $y = f(x)$ lớn nhất của hàm số trên tập xác định.",
        "Tọa độ điểm $(x_0; f(x_0))$ trên mặt phẳng tọa độ.",
        "Nghiệm duy nhất của phương trình $f(x) = 0$."
      ],
      correctAnswerIndex: 0,
      solution: "Định nghĩa SGK GDPT 2018: Điểm cực đại của hàm số là giá trị $x_0$ của biến số mà tại đó hàm số đạt cực đại."
    },
    {
      id: 4,
      level: 'Nhận biết',
      question: "Cho hàm số $y = x^3 - 3x$. Số điểm cực trị của hàm số là:",
      options: [
        "$0$",
        "$1$",
        "$3$",
        "$2$"
      ],
      correctAnswerIndex: 3,
      solution: "$y' = 3x^2 - 3 = 0 \\Leftrightarrow x = \\pm 1$. Đạo hàm đổi dấu qua hai nghiệm phân biệt này nên hàm số có $2$ điểm cực trị."
    },
    {
      id: 5,
      level: 'Thông hiểu',
      question: "Hàm số $y = \\frac{2x + 1}{x - 3}$ nghịch biến trên khoảng nào sau đây?",
      options: [
        "$(-\\infty; +\\infty)$",
        "$(3; +\\infty)$",
        "$\\mathbb{R} \\setminus \\{3\\}$",
        "$(-3; 3)$"
      ],
      correctAnswerIndex: 1,
      solution: "TXĐ $D = \\mathbb{R} \\setminus \\{3\\}$. $y' = \\frac{2(-3) - 1(1)}{(x-3)^2} = \\frac{-7}{(x-3)^2} < 0, \\forall x \\neq 3$. Hàm số nghịch biến trên $(-\\infty; 3)$ và $(3; +\\infty)$."
    },
    {
      id: 6,
      level: 'Thông hiểu',
      question: "Hàm số $y = x^3 - 3x^2 - 9x + 5$ đồng biến trên các khoảng nào?",
      options: [
        "$(-1; 3)$",
        "$(-\\infty; 3)$",
        "$(-\\infty; -1)$ và $(3; +\\infty)$",
        "$(-1; +\\infty)$"
      ],
      correctAnswerIndex: 2,
      solution: "$y' = 3x^2 - 6x - 9 = 3(x+1)(x-3)$. $y' > 0 \\Leftrightarrow x < -1$ hoặc $x > 3$."
    },
    {
      id: 7,
      level: 'Thông hiểu',
      question: "Cho hàm số $y = -x^4 + 8x^2 - 5$. Giá trị cực đại $y_{CĐ}$ của hàm số bằng:",
      options: [
        "$11$",
        "$-5$",
        "$2$",
        "$16$"
      ],
      correctAnswerIndex: 0,
      solution: "$y' = -4x^3 + 16x = -4x(x^2 - 4) = 0 \\Leftrightarrow x = 0, x = \\pm 2$. Cực đại đạt tại $x = \\pm 2$, giá trị cực đại $y(\\pm 2) = -16 + 8(4) - 5 = 11$."
    },
    {
      id: 8,
      level: 'Thông hiểu',
      question: "Hàm số $y = \\frac{x^2 - 3x + 3}{x - 1}$ đạt cực đại tại điểm nào?",
      options: [
        "$x = 2$",
        "$x = 1$",
        "$x = 3$",
        "$x = 0$"
      ],
      correctAnswerIndex: 3,
      solution: "$y = x - 2 + \\frac{1}{x-1} \\Rightarrow y' = 1 - \\frac{1}{(x-1)^2} = \\frac{x(x-2)}{(x-1)^2}$. $y' = 0 \\Leftrightarrow x = 0$ hoặc $x = 2$. $y'$ đổi dấu từ $+$ sang $-$ qua $x = 0$ nên $x = 0$ là điểm cực đại."
    },
    {
      id: 9,
      level: 'Thông hiểu',
      question: "Điểm cực trị của đồ thị hàm số $y = x^4 - 2x^2 + 3$ nằm trên trục tung là điểm có tọa độ nào?",
      options: [
        "$(0; 2)$",
        "$(0; 3)$",
        "$(0; -2)$",
        "$(0; 1)$"
      ],
      correctAnswerIndex: 1,
      solution: "Giao điểm với trục tung ứng với $x = 0 \\Rightarrow y = 3$. Vì $y'(0) = 0$ và đổi dấu qua $x = 0$ nên $(0; 3)$ là điểm cực đại của đồ thị."
    },
    {
      id: 10,
      level: 'Vận dụng',
      question: "Hàm số $y = \\sqrt{6x - x^2}$ nghịch biến trên khoảng nào?",
      options: [
        "$(3; 6)$",
        "$(0; 3)$",
        "$(0; 6)$",
        "$(3; +\\infty)$"
      ],
      correctAnswerIndex: 0,
      solution: "TXĐ: $[0; 6]$. Với $x \\in (0; 6)$, $y' = \\frac{3 - x}{\\sqrt{6x - x^2}}$. $y' < 0 \\Leftrightarrow x > 3$. Kết hợp TXĐ suy ra khoảng nghịch biến là $(3; 6)$."
    },
    {
      id: 11,
      level: 'Vận dụng',
      question: "Tìm tất cả các giá trị của tham số $m$ để hàm số $y = \\frac{1}{3}x^3 - mx^2 + 4x + 1$ có hai điểm cực trị phân biệt.",
      options: [
        "$-2 < m < 2$",
        "$-2 \\le m \\le 2$",
        "$m < -2$ hoặc $m > 2$",
        "$m > 2$"
      ],
      correctAnswerIndex: 2,
      solution: "$y' = x^2 - 2mx + 4$. Hàm số có 2 điểm cực trị khi $y' = 0$ có 2 nghiệm phân biệt $\\Leftrightarrow \\Delta' = m^2 - 4 > 0 \\Leftrightarrow m < -2$ hoặc $m > 2$."
    },
    {
      id: 12,
      level: 'Vận dụng',
      question: "Cho hàm số $y = \\frac{x^2 - 2x + 5}{x - 1}$. Tích giá trị cực đại và giá trị cực tiểu ($y_{CĐ} \\cdot y_{CT}$) của hàm số bằng:",
      options: [
        "$16$",
        "$-8$",
        "$8$",
        "$-16$"
      ],
      correctAnswerIndex: 3,
      solution: "$y = x - 1 + \\frac{4}{x-1} \\Rightarrow y' = 1 - \\frac{4}{(x-1)^2} = 0 \\Leftrightarrow x = -1$ hoặc $x = 3$. Tại $x = -1 \\Rightarrow y_{CĐ} = -4$. Tại $x = 3 \\Rightarrow y_{CT} = 4$. Tích giá trị cực đại và cực tiểu là $y_{CĐ} \\cdot y_{CT} = (-4) \\cdot 4 = -16$."
    },
    {
      id: 13,
      level: 'Vận dụng',
      question: "Tìm $m$ để hàm số $y = \\frac{mx - 2}{x - m + 1}$ đồng biến trên từng khoảng xác định.",
      options: [
        "$-1 < m < 2$",
        "$m < -1$ hoặc $m > 2$",
        "$m > 2$",
        "$m < -1$"
      ],
      correctAnswerIndex: 0,
      solution: "$y' = \\frac{m(-m+1) - (-2)(1)}{(x-m+1)^2} = \\frac{-m^2 + m + 2}{(x-m+1)^2}$. Hàm số đồng biến $\\Leftrightarrow -m^2 + m + 2 > 0 \\Leftrightarrow -1 < m < 2$."
    },
    {
      id: 14,
      level: 'Vận dụng cao',
      question: "Nồng độ một loại thuốc trong máu sau $t$ giờ kể từ khi uống được cho bởi $C(t) = \\frac{2t}{t^2 + 1}$ (mg/lít, $t \\ge 0$). Sau bao lâu thì nồng độ thuốc trong máu đạt mức cao nhất?",
      options: [
        "$2$ giờ",
        "$1$ giờ",
        "$0,5$ giờ",
        "$1,5$ giờ"
      ],
      correctAnswerIndex: 1,
      solution: "$C'(t) = \\frac{2(t^2+1) - 2t(2t)}{(t^2+1)^2} = \\frac{2 - 2t^2}{(t^2+1)^2} = 0 \\Leftrightarrow t = 1$ (vì $t \\ge 0$). $C'(t)$ đổi dấu từ $+$ sang $-$ qua $t = 1$ nên nồng độ thuốc đạt đỉnh sau $1$ giờ."
    },
    {
      id: 15,
      level: 'Vận dụng cao',
      question: "Một trang trại muốn rào một khu đất hình chữ nhật giáp một bờ sông thẳng để chăn nuôi (không cần rào phía bờ sông). Bác nông dân có $120\\text{ m}$ lưới rào. Diện tích khu đất lớn nhất có thể rào được là bao nhiêu?",
      options: [
        "$3600\\text{ m}^2$",
        "$900\\text{ m}^2$",
        "$1800\\text{ m}^2$",
        "$1200\\text{ m}^2$"
      ],
      correctAnswerIndex: 2,
      solution: "Gọi $x$ (m) là chiều rộng khu đất ($0 < x < 60$). Chiều dài dọc theo bờ sông là $120 - 2x$. Diện tích khu đất là $S(x) = x(120 - 2x) = -2x^2 + 120x$. $S'(x) = -4x + 120 = 0 \\Leftrightarrow x = 30$. Diện tích lớn nhất là $S(30) = 30(60) = 1800\\text{ m}^2$."
    }
  ]
];
