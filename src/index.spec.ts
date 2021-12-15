import '@testing-library/jest-dom'

import { groute } from './'
import { screen } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'

const setUpGroute = () => {
  const onActivateUsers = jest.fn();
  const onActivateUser = jest.fn();

  groute([{
    path: "",
    content: `
      <h1>Welcome.</h1>
      <a href="/users">View users</a>
    `
  }, {
    path: "users",
    outlet: "#user-list",
    content: `<h1>User list</h1><div id="user-list"></div>`,
    onActivate: onActivateUsers,
    children: [{
      path: "",
      content: `
        <a href="/users/1">First user</a>
        <a href="/users/2">Second user</a>
        <a href="/users/3">Third user</a>
      `
    }, {
      path: ":id",
      content: "<h2>User</h2>",
      onActivate: onActivateUser
    }],
  }, {
    path: "*",
    content: "<h1>Not found.</h1>"
  }])

  window.dispatchEvent(new Event("DOMContentLoaded", { bubbles: true, cancelable: true }))

  return { onActivateUser, onActivateUsers };
}

// Mock history and location href
describe('without overriding options', () => {
  it('overrides default behavior for links', () => {
    const { onActivateUsers, onActivateUser } = setUpGroute();

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Welcome.")

    userEvent.click(screen.queryByRole("link", { name: "View users" }))
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("User list")
    expect(screen.getAllByRole("link").length).toEqual(3)

    // TODO: Sort out times.
    expect(onActivateUsers).toHaveBeenCalled()
    expect(onActivateUser).not.toHaveBeenCalled()

    userEvent.click(screen.queryByRole("link", { name: "Second user" }))
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("User list")
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("User")

    expect(onActivateUsers).toHaveBeenCalled()
    expect(onActivateUser).toHaveBeenCalledWith({ id: '2' })
  });
})