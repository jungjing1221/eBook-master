<template>
  <section
    class="hero is-primary is-fullheight"
    style="background-color: #bb9981"
  >
    <div class="hero-body">
      <div class="container">
        <div class="columns is-centered">
          <div>
            <form class="box content">
              <h1>ลงชื่อเข้าใช้</h1>

              <p
                v-if="error"
                class="
                  px-3
                  py-2
                  mb-3
                  has-text-danger-dark has-background-danger-light
                "
              >
                {{ error }}
              </p>

              <div class="field">
                <label for="" class="label">ชื่อผู้ใช้</label>
                <div class="control has-icons-left">
                  <input
                    type="text"
                    v-model="username"
                    class="input"
                    required
                  />
                  <span class="icon is-small is-left">
                    <i class="fas fa-user"></i>
                  </span>
                </div>
              </div>
              <div class="field">
                <label for="" class="label">รหัสผ่าน</label>
                <div class="control has-icons-left">
                  <input
                    type="password"
                    placeholder="*******"
                    v-model="password"
                    class="input"
                    required
                  />
                  <span class="icon is-small is-left">
                    <i class="fa fa-lock"></i>
                  </span>
                </div>
              </div>
              <div class="field">
                <button
                  class="button is-success"
                  style="background-color: #e9efc0; color: #534340"
                  type="button"
                  @click="submit()"
                >
                  เข้าสู่ระบบ
                </button>
              </div>
              <div class="field">
                <div>ยังไม่มีบัญชีผู้ใช้หรอ?</div>
                <a st href="/signUp" style="color: #6a5acd"
                  >สมัครสมาชิกที่นี่</a
                >
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import axios from "@/plugins/axios";
import useVuelidate from "../../node_modules/@vuelidate/core";
import { required } from "../../node_modules/@vuelidate/validators";
export default {
  setup() {
    return { v$: useVuelidate() };
  },
  data() {
    return {
      username: "",
      password: "",
      error: "",
    };
  },
  validations() {
    return {
      username: { required },
      password: { required },
    };
  },
  methods: {
    submit() {
      if (this.v$.$invalid) {
        return alert("กรุณาตรวจสอบข้อมูลให้ดีด้วยน้า");
      }
      // console.log("test");
      const data = {
        username: this.username,
        password: this.password,
      };
      axios
        .post("http://localhost:5000/user/login", data)
        .then((res) => {
          const token = res.data.token;
          localStorage.setItem("token", token);
          this.$emit("auth-change");
          this.$router.push({ path: "/" });
        })
        .catch((error) => {
          this.error = error.response.data;
          console.log(error.response.data);
        });
    },
  },
};
</script>

<style scoped>
#login {
  width: 500px;
  background-color: #f4fcd9;
  border: 100px solid #c5d8a4;
  margin: auto;
  margin-top: 200px;
  padding: 20px;
}
</style>