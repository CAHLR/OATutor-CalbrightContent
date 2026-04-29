import React from "react";
import ReactDOM from "react-dom";
import { act } from "react-dom/test-utils";
import { Route, Router } from "react-router-dom";
import { createMemoryHistory } from "history";

import QueryForm, { QueryForm5Point } from "./QueryForm";
import { ThemeContext } from "../../config/config.js";

jest.mock("@components/BrandLogoNav", () => () => <div>BrandLogoNav</div>);
jest.mock("@components/Popup/Popup", () => ({ children }) => <div>{children}</div>);
jest.mock("../../pages/Posts/About", () => () => <div>About</div>);

const sharedLessonId = "1cSXQ5Df-5PHn-jeatrYLxjl";

const makeJwt = (payload) => {
  const base64Payload = btoa(JSON.stringify(payload))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
  return `test.${base64Payload}.sig`;
};

const renderQueryForm = async ({
  route = `/query/5point?returnTo=${encodeURIComponent(
    `/courses/1/lessons/${sharedLessonId}/confirm`
  )}`,
  themeValue,
} = {}) => {
  const div = document.createElement("div");
  document.body.appendChild(div);
  const history = createMemoryHistory({ initialEntries: [route] });

  await act(async () => {
    ReactDOM.render(
      <ThemeContext.Provider value={themeValue}>
        <Router history={history}>
          <Route exact path="/query/5point">
            <QueryForm5Point />
          </Route>
          <Route exact path="/query/custom">
            <QueryForm />
          </Route>
          <Route
            exact
            path="/courses/:courseNum/lessons/:lessonID/confirm"
            render={() => <div id="confirm-screen">confirm</div>}
          />
          <Route
            exact
            path="/lessons/:lessonID/confirm"
            render={() => <div id="confirm-screen">confirm</div>}
          />
          <Route
            exact
            path="/intake/:courseNum"
            render={() => <div id="intake-screen">intake</div>}
          />
          <Route
            exact
            path="/lessons/:lessonID"
            render={() => <div id="lesson-screen">lesson</div>}
          />
        </Router>
      </ThemeContext.Provider>,
      div
    );
  });

  return {
    div,
    history,
    cleanup: () => {
      ReactDOM.unmountComponentAtNode(div);
      div.remove();
    },
  };
};

describe("QueryForm skip behavior", () => {
  it("submits dummy -1 responses to Firebase when skip is clicked", async () => {
    const submitSurvey = jest.fn().mockResolvedValue(undefined);
    const token = makeJwt({
      linkedLesson: sharedLessonId,
      confirmationMode: "generic",
      course_id: "canvas-section-2",
      course_name: "Section 2",
    });
    const themeValue = {
      firebase: {
        db: {},
        ltiContext: {},
        submitSurvey,
      },
      user: {},
      jwt: token,
    };

    const { div, cleanup } = await renderQueryForm({ themeValue });

    try {
      const skipButton = Array.from(div.querySelectorAll("button")).find(
        (button) => button.textContent === "Skip"
      );

      expect(skipButton).toBeTruthy();

      await act(async () => {
        skipButton.dispatchEvent(
          new MouseEvent("click", { bubbles: true, cancelable: true })
        );
      });

      expect(submitSurvey).toHaveBeenCalledTimes(1);
      expect(submitSurvey).toHaveBeenCalledWith({
        completed: true,
        skipped: true,
        page1: Object.fromEntries(
          Array.from({ length: 12 }, (_, index) => [`q${index + 1}`, -1])
        ),
        page2: Object.fromEntries(
          Array.from({ length: 25 }, (_, index) => [`q${index + 1}`, -1])
        ),
      });
    } finally {
      cleanup();
    }
  });

  it("routes Section 2 skip to the lesson confirmation screen", async () => {
    const submitSurvey = jest.fn().mockResolvedValue(undefined);
    const token = makeJwt({
      linkedLesson: sharedLessonId,
      confirmationMode: "generic",
      course_id: "canvas-section-2",
      course_name: "Section 2",
    });
    const themeValue = {
      firebase: {
        db: {},
        ltiContext: {},
        submitSurvey,
      },
      user: {},
      jwt: token,
    };

    const { div, history, cleanup } = await renderQueryForm({ themeValue });

    try {
      const skipButton = Array.from(div.querySelectorAll("button")).find(
        (button) => button.textContent === "Skip"
      );

      await act(async () => {
        skipButton.dispatchEvent(
          new MouseEvent("click", { bubbles: true, cancelable: true })
        );
      });

      expect(history.location.pathname).toBe(
        `/courses/1/lessons/${sharedLessonId}/confirm`
      );
    } finally {
      cleanup();
    }
  });

  it("routes Section 3 skip to intake when no intake form exists yet", async () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    const submitSurvey = jest.fn().mockResolvedValue(undefined);
    const token = makeJwt({
      linkedLesson: sharedLessonId,
      confirmationMode: "personalized",
      course_id: "canvas-section-3",
      course_name: "Section 3",
    });
    const themeValue = {
      firebase: {
        db: null,
        ltiContext: {
          user_id: "student-1",
        },
        submitSurvey,
      },
      user: {},
      jwt: token,
    };

    const { div, history, cleanup } = await renderQueryForm({ themeValue });

    try {
      const skipButton = Array.from(div.querySelectorAll("button")).find(
        (button) => button.textContent === "Skip"
      );

      await act(async () => {
        skipButton.dispatchEvent(
          new MouseEvent("click", { bubbles: true, cancelable: true })
        );
      });

      expect(history.location.pathname).toBe("/intake/canvas-section-3");
    } finally {
      warnSpy.mockRestore();
      cleanup();
    }
  });
});
