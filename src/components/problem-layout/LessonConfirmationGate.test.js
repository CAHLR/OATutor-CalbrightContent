import React from "react";
import ReactDOM from "react-dom";
import { act } from "react-dom/test-utils";
import { Router, Route } from "react-router-dom";
import { createMemoryHistory } from "history";

import LessonConfirmationGate from "./LessonConfirmationGate";
import { ThemeContext } from "../../config/config.js";

jest.mock("./LessonConfirmation", () => () => (
  <div id="lesson-confirmation-screen">lesson confirmation</div>
));

const sharedLessonId = "1cSXQ5Df-5PHn-jeatrYLxjl";

const makeJwt = (payload) => {
  const base64Payload = btoa(JSON.stringify(payload))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
  return `test.${base64Payload}.sig`;
};

describe("LessonConfirmationGate", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows lesson confirmation for Section 3 when intake already exists", async () => {
    const token = makeJwt({
      linkedLesson: sharedLessonId,
      confirmationMode: "personalized",
      course_id: "canvas-section-3",
      course_name: "Section 3",
    });
    const history = createMemoryHistory({
      initialEntries: [`/lessons/${sharedLessonId}/confirm?token=${token}`],
    });
    const div = document.createElement("div");
    document.body.appendChild(div);

    localStorage.setItem(
      "intake:student-1:course:canvas-section-3",
      JSON.stringify({
        q1: "N/A",
        q2: "N/A",
        q3: "N/A",
        completed: true,
      })
    );

    await act(async () => {
      ReactDOM.render(
        <ThemeContext.Provider
          value={{
            firebase: {
              ltiContext: {
                user_id: "student-1",
              },
            },
            jwt: token,
            user: {},
          }}
        >
          <Router history={history}>
            <Route exact path="/lessons/:lessonID/confirm">
              <LessonConfirmationGate />
            </Route>
          </Router>
        </ThemeContext.Provider>,
        div
      );
    });

    try {
      expect(history.location.pathname).toBe(`/lessons/${sharedLessonId}/confirm`);
      expect(div.querySelector("#lesson-confirmation-screen")).toBeTruthy();
    } finally {
      ReactDOM.unmountComponentAtNode(div);
      div.remove();
    }
  });
});
