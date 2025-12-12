import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type Role = "Admin" | "ProjectManager" | "Developer";

interface User {
  id: string;
  name: string;
  role: Role;
  token?: string;
}

interface AuthState {
  user: User | null;
  hydrated: boolean;
}

const initialState: AuthState = {
  user: null,
  hydrated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginSuccess(state, action: PayloadAction<User>) {
      state.user = action.payload;
      localStorage.setItem("auth-user", JSON.stringify(action.payload));
    },
    logout(state) {
      state.user = null;
      localStorage.removeItem("auth-user");
    },
    hydrateAuth(state) {
      const saved = localStorage.getItem("auth-user");
      if (saved) {
        state.user = JSON.parse(saved);
      }
      state.hydrated = true;
    },
  },
});

export const { loginSuccess, logout, hydrateAuth } = authSlice.actions;

export default authSlice.reducer;
