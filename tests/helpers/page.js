const puppeteer = require('puppeteer');
const sessionFactory = require('../factories/sessionFactory');
const userFactory = require('../factories/userFactory');

class CustomPage {
  static async build() {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox']
    })

    const page = await browser.newPage();
    const customPage = new CustomPage(page)

    return new Proxy(customPage, {
      // target is pointing at customPage --> so target[property] is exactly the same as customPage[property]
      get: function(target, property) {
        return target[property] || browser[property] || page[property]
      }
    })
  }

  constructor(page) {
    this.page = page;
  }

  async login() {
    const user = await userFactory()
    const { session, sig } = sessionFactory(user)
 
    // Cookie names can be obatined looking into the Application/Cookies in Chrome
    await this.page.setCookie({ name: 'session', value: session})
    await this.page.setCookie({ name: 'session.sig', value: sig})
    // We need to refresh the page to make the cookies work (authenticate)
    await this.page.goto('http://localhost:3000/blogs')
    await this.page.waitFor('a[href="/auth/logout"]')  
  }

  async getContentsOf(selector) {
    return this.page.$eval(selector, el => el.innerHTML)
  }

  get(path) {
    return this.page.evaluate(
      (_path) => {
        return fetch(_path, {
          method: 'GET',
          credentials: 'same-origin',
          headers: {
            'Content-Type': 'application/json'
          }
        })
          .then(res => res.json());
      }, 
      path
    );
  }

  post(path, data) {
    return this.page.evaluate(
      (_path, _data) => {
        return fetch(_path, {
          method: 'POST',
          credentials: 'same-origin',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(_data)
        })
          .then(res => res.json());
      }, 
      path,
      data
    )
  }

  execRequests(actions) {
    return Promise.all(
      actions.map(({ method, path, data }) => {
        return this[method](path, data);
      })
    );
  }

}

module.exports = CustomPage;
