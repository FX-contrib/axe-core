// This method is mostly tested through color-contrast integrations
describe('visually-sort', () => {
  const html = axe.testUtils.html;

  const fixture = document.querySelector('#fixture');
  const visuallySort = axe.commons.dom.visuallySort;
  const querySelectorAll = axe.utils.querySelectorAll;
  let root;

  beforeEach(() => {
    fixture.innerHTML = html`
      <header
        id="1"
        style="position: absolute; z-index: 999; height: 50px; width: 100%;"
      >
        <div id="2" style="display: flex; position: relative; height: 50px;">
          <div
            id="3"
            style="position: relative; height: 50px; width: 100%;"
          ></div>
        </div>
      </header>
      <div
        id="4"
        style="position: absolute; z-index: 10; height: 50px; width: 100%;"
      >
        <div id="5" style="position: absolute; transform: translate(0, -50%);">
          <div id="6">
            <div id="7" style="float: left">Text</div>
            <div id="8">Text</div>
            <span id="9">Text</span>
            <div id="10">Text</div>
            <div id="shadow-host"></div>
          </div>
        </div>
      </div>
    `;
    const shadowRoot = fixture
      .querySelector('#shadow-host')
      .attachShadow({ mode: 'open' });
    shadowRoot.innerHTML = '<div id="shadow-child">Text</div>';
    root = axe.setup(fixture);
  });

  /*
    Array.sort() return meanings:

    compareFn(a, b) | return value sort order
    ----------------|-----------------------
    > 0             | sort a after b, e.g. [b, a]
    < 0             | sort a before b, e.g. [a, b]
    === 0           | keep original order of a and b
  */

  it('sorts a higher stack before a lower stack', () => {
    const vNodeA = querySelectorAll(root, '#1')[0];
    const vNodeB = querySelectorAll(root, '#4')[0];

    assert.isBelow(visuallySort(vNodeA, vNodeB), 0);
  });

  it('sorts a lower stack after a higher stack', () => {
    const vNodeA = querySelectorAll(root, '#4')[0];
    const vNodeB = querySelectorAll(root, '#1')[0];

    assert.isAbove(visuallySort(vNodeA, vNodeB), 0);
  });

  it('sorts a child stack before a parent stack', () => {
    const vNodeA = querySelectorAll(root, '#6')[0];
    const vNodeB = querySelectorAll(root, '#4')[0];

    assert.isBelow(visuallySort(vNodeA, vNodeB), 0);
  });

  it('sorts a parent stack after a child stack', () => {
    const vNodeA = querySelectorAll(root, '#4')[0];
    const vNodeB = querySelectorAll(root, '#6')[0];

    assert.isAbove(visuallySort(vNodeA, vNodeB), 0);
  });

  it('sorts a child of a higher stack before a child of a lower stack', () => {
    const vNodeA = querySelectorAll(root, '#3')[0];
    const vNodeB = querySelectorAll(root, '#7')[0];

    assert.isBelow(visuallySort(vNodeA, vNodeB), 0);
  });

  it('sorts a child of a lower stack after a child of a higher stack', () => {
    const vNodeA = querySelectorAll(root, '#7')[0];
    const vNodeB = querySelectorAll(root, '#3')[0];

    assert.isAbove(visuallySort(vNodeA, vNodeB), 0);
  });

  it('sorts elements by tree order when in the same stack', () => {
    const vNodeA = querySelectorAll(root, '#8')[0];
    const vNodeB = querySelectorAll(root, '#10')[0];

    assert.isAbove(visuallySort(vNodeA, vNodeB), 0);
  });

  it('sorts floated elements before other elements of the same stack', () => {
    const vNodeA = querySelectorAll(root, '#7')[0];
    const vNodeB = querySelectorAll(root, '#8')[0];

    assert.isBelow(visuallySort(vNodeA, vNodeB), 0);
  });

  it('sorts shadow DOM elements by tree order when in the same stack', () => {
    const vNodeA = querySelectorAll(root, '#8')[0];
    const vNodeB = querySelectorAll(root, '#shadow-host')[0].children[0];

    assert.isAbove(visuallySort(vNodeA, vNodeB), 0);
  });

  describe('with a block inside an inline element', () => {
    beforeEach(() => {
      fixture.innerHTML = html`
        <img id="img" style="width: 50px; height: 50px; margin-bottom: -25px" />
        <a id="anchor" href="#">
          <div id="child1">
            <div id="child2"><span id="child3">Hello World</span></div>
          </div>
        </a>
        <span>
          <div style="position: relative">
            <span id="inline-in-positioned">Hello</span>
            <div id="block-in-positioned">World</div>
          </div>
        </span>
        <span><span id="inline-after">Hello</span></span>
      `;
      axe.teardown();
      root = axe.setup(fixture);
    });

    it('sorts the block above an inline element that comes before it', () => {
      const vNodeA = querySelectorAll(root, '#img')[0];
      const vNodeB = querySelectorAll(root, '#child1')[0];

      // Chrome's elementsFromPoint returns #child1 above #img where they overlap
      assert.isAbove(visuallySort(vNodeA, vNodeB), 0);
      assert.isBelow(visuallySort(vNodeB, vNodeA), 0);
    });

    it('sorts a nested block above an inline element that comes before it', () => {
      const vNodeA = querySelectorAll(root, '#img')[0];
      const vNodeB = querySelectorAll(root, '#child2')[0];

      assert.isAbove(visuallySort(vNodeA, vNodeB), 0);
    });

    it('sorts the block by tree order against inline elements after it', () => {
      const vNodeA = querySelectorAll(root, '#child1')[0];
      const vNodeB = querySelectorAll(root, '#inline-after')[0];

      assert.isAbove(visuallySort(vNodeA, vNodeB), 0);
    });

    it('sorts blocks below inline content inside a positioned block', () => {
      const vNodeA = querySelectorAll(root, '#inline-in-positioned')[0];
      const vNodeB = querySelectorAll(root, '#block-in-positioned')[0];

      // the positioned block paints its own content in normal order, even
      // though it sits inside an inline element itself
      assert.isBelow(visuallySort(vNodeA, vNodeB), 0);
    });
  });
});
