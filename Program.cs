using Piu.Models;
using Piu.Services;
using SixLabors.ImageSharp.Web.DependencyInjection;
using Microsoft.Extensions.FileProviders;

var builder = WebApplication.CreateBuilder(args);

// Strongly typed configuration using IOptions pattern
builder.Services.Configure<BirthdayConfig>(
    builder.Configuration.GetSection(BirthdayConfig.SectionName));

// Register domain services
builder.Services.AddSingleton<ImageService>();
builder.Services.AddSingleton<AudioService>();
builder.Services.AddScoped<BirthdayContentService>();

// Add ImageSharp for on-the-fly image optimization
builder.Services.AddImageSharp();

// Add Controllers for APIs
builder.Services.AddControllers();

// Razor Pages
builder.Services.AddRazorPages();

var app = builder.Build();

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
    app.UseHsts();
}
else
{
    app.UseDeveloperExceptionPage();
}

app.UseHttpsRedirection();

// ImageSharp Middleware MUST be placed before UseStaticFiles
app.UseImageSharp();

app.UseStaticFiles();

// Serve the external Google Photos backup safely
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(@"C:\dipamondalsnt@gmail.com_photos_backup\2021_2026\Takeout\Google Photos\Photos from 2020"),
    RequestPath = "/external-photos",
    ServeUnknownFileTypes = true,
    DefaultContentType = "image/jpeg"
});

app.UseRouting();

app.MapControllers();
app.MapRazorPages();

app.Run();
